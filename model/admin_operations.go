package model

import (
	"regexp"
	"strconv"

	"github.com/0uiYu/api-project/common"
	"github.com/0uiYu/api-project/constant"
)

var adminHTTPStatusPattern = regexp.MustCompile(`\b([45][0-9]{2})\b`)

type AdminModelUsage struct {
	ModelName string `json:"model_name"`
	Requests  int64  `json:"requests"`
	Quota     int64  `json:"quota"`
	Tokens    int64  `json:"tokens"`
}

type AdminErrorUsage struct {
	ModelName string `json:"model_name"`
	Count     int64  `json:"count"`
}

type AdminChannelUsage struct {
	ChannelID      int     `json:"channel_id"`
	ChannelName    string  `json:"channel_name"`
	Requests       int64   `json:"requests"`
	FailedRequests int64   `json:"failed_requests"`
	SuccessRate    float64 `json:"success_rate"`
	AverageLatency float64 `json:"average_latency_seconds"`
}

type AdminStatusUsage struct {
	Status string `json:"status"`
	Count  int64  `json:"count"`
}

type AdminRedemptionUsage struct {
	Total   int64 `json:"total"`
	Enabled int64 `json:"enabled"`
	Used    int64 `json:"used"`
}

// AdminTaskUsage summarizes generation tasks (video, music, image) for the
// operations overview. Stuck counts unfinished tasks the timeout sweeper has
// not settled yet.
type AdminTaskUsage struct {
	Total     int64 `json:"total"`
	Running   int64 `json:"running"`
	Succeeded int64 `json:"succeeded"`
	Failed    int64 `json:"failed"`
	Stuck     int64 `json:"stuck"`
}

type AdminOperationsOverview struct {
	Usage       *AdminUsageSummary   `json:"usage"`
	Models      []AdminModelUsage    `json:"models"`
	Errors      []AdminErrorUsage    `json:"errors"`
	Channels    []AdminChannelUsage  `json:"channels"`
	Statuses    []AdminStatusUsage   `json:"statuses"`
	Redemptions AdminRedemptionUsage `json:"redemptions"`
	Tasks       AdminTaskUsage       `json:"tasks"`
}

// GetAdminTaskUsage counts tasks created in the range, split by terminal state.
// Stuck uses the same predicate as model.GetTimedOutUnfinishedTasks — the query
// the timeout sweeper acts on — so the number matches what the system will
// clean up next. It is not limited to the range: a task stuck since yesterday
// still needs attention today.
func GetAdminTaskUsage(startTime, endTime int64) (AdminTaskUsage, error) {
	usage := AdminTaskUsage{}
	unfinished := []string{TaskStatusFailure, TaskStatusSuccess}
	createdInRange := DB.Model(&Task{}).Where("created_at >= ? AND created_at <= ?", startTime, endTime)
	if err := createdInRange.Count(&usage.Total).Error; err != nil {
		return usage, err
	}
	if err := DB.Model(&Task{}).Where("created_at >= ? AND created_at <= ?", startTime, endTime).Where("status = ?", TaskStatusSuccess).Count(&usage.Succeeded).Error; err != nil {
		return usage, err
	}
	if err := DB.Model(&Task{}).Where("created_at >= ? AND created_at <= ?", startTime, endTime).Where("status = ?", TaskStatusFailure).Count(&usage.Failed).Error; err != nil {
		return usage, err
	}
	if err := DB.Model(&Task{}).Where("created_at >= ? AND created_at <= ?", startTime, endTime).Where("status NOT IN ?", unfinished).Count(&usage.Running).Error; err != nil {
		return usage, err
	}
	if constant.TaskTimeoutMinutes > 0 {
		cutoff := common.GetTimestamp() - int64(constant.TaskTimeoutMinutes)*60
		if err := DB.Model(&Task{}).Where("progress != ?", "100%").Where("status NOT IN ?", unfinished).Where("submit_time < ?", cutoff).Count(&usage.Stuck).Error; err != nil {
			return usage, err
		}
	}
	return usage, nil
}

type AdminOperationsTrendPoint struct {
	Timestamp        int64   `json:"timestamp"`
	Requests         int64   `json:"requests"`
	FailedRequests   int64   `json:"failed_requests"`
	ChargedQuota     int64   `json:"charged_quota"`
	InputTokens      int64   `json:"input_tokens"`
	OutputTokens     int64   `json:"output_tokens"`
	CacheReadTokens  int64   `json:"cache_read_tokens"`
	CacheWriteTokens int64   `json:"cache_write_tokens"`
	TopUpAmount      float64 `json:"top_up_amount"`
	ReferenceCost    float64 `json:"reference_cost_usd"`
	ReferenceProfit  float64 `json:"reference_profit_usd"`
}

func GetAdminOperationsTrend(startTime, endTime, interval int64) ([]AdminOperationsTrendPoint, error) {
	if interval < 3600 {
		interval = 3600
	}
	base := startTime - startTime%interval
	points := make([]AdminOperationsTrendPoint, 0)
	for bucket := base; bucket <= endTime; bucket += interval {
		points = append(points, AdminOperationsTrendPoint{Timestamp: bucket})
	}
	index := func(timestamp int64) int {
		value := int((timestamp - base) / interval)
		if value < 0 || value >= len(points) {
			return -1
		}
		return value
	}
	type logRow struct {
		CreatedAt        int64
		Quota            int64
		InputTokens      int64
		OutputTokens     int64
		CacheReadTokens  int64
		CacheWriteTokens int64
		ReferenceCost    float64
		ReferenceProfit  float64
		CostAvailable    bool
	}
	var consumes []logRow
	if err := LOG_DB.Model(&Log{}).Select("created_at, quota, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, reference_cost_usd, reference_profit_usd, cost_available").Where("type = ? AND created_at >= ? AND created_at <= ?", LogTypeConsume, startTime, endTime).Find(&consumes).Error; err != nil {
		return nil, err
	}
	for _, row := range consumes {
		if i := index(row.CreatedAt); i >= 0 {
			point := &points[i]
			point.Requests++
			point.ChargedQuota += row.Quota
			point.InputTokens += row.InputTokens
			point.OutputTokens += row.OutputTokens
			point.CacheReadTokens += row.CacheReadTokens
			point.CacheWriteTokens += row.CacheWriteTokens
			if row.CostAvailable {
				point.ReferenceCost += row.ReferenceCost
				point.ReferenceProfit += row.ReferenceProfit
			}
		}
	}
	var failures []struct{ CreatedAt int64 }
	if err := LOG_DB.Model(&Log{}).Select("created_at").Where("type = ? AND created_at >= ? AND created_at <= ?", LogTypeError, startTime, endTime).Find(&failures).Error; err != nil {
		return nil, err
	}
	for _, row := range failures {
		if i := index(row.CreatedAt); i >= 0 {
			points[i].FailedRequests++
		}
	}
	var topups []TopUp
	if err := DB.Where("status = ? AND complete_time >= ? AND complete_time <= ?", common.TopUpStatusSuccess, startTime, endTime).Select("complete_time, money").Find(&topups).Error; err != nil {
		return nil, err
	}
	for _, topup := range topups {
		if i := index(topup.CompleteTime); i >= 0 {
			points[i].TopUpAmount += topup.Money
		}
	}
	return points, nil
}

func GetAdminOperationsOverview(startTime, endTime int64) (*AdminOperationsOverview, error) {
	usage, err := GetAdminUsageSummary(startTime, endTime)
	if err != nil {
		return nil, err
	}
	result := &AdminOperationsOverview{Usage: usage, Models: []AdminModelUsage{}, Errors: []AdminErrorUsage{}, Channels: []AdminChannelUsage{}, Statuses: []AdminStatusUsage{}}
	tasks, err := GetAdminTaskUsage(startTime, endTime)
	if err != nil {
		return nil, err
	}
	result.Tasks = tasks
	consume := LOG_DB.Model(&Log{}).Where("type = ? AND created_at >= ? AND created_at <= ?", LogTypeConsume, startTime, endTime)
	if err := consume.Select("model_name, COUNT(*) AS requests, COALESCE(SUM(quota), 0) AS quota, COALESCE(SUM(input_tokens + output_tokens), 0) AS tokens").Group("model_name").Order("quota DESC").Limit(10).Scan(&result.Models).Error; err != nil {
		return nil, err
	}
	errorsQuery := LOG_DB.Model(&Log{}).Where("type = ? AND created_at >= ? AND created_at <= ?", LogTypeError, startTime, endTime)
	if err := errorsQuery.Select("model_name, COUNT(*) AS count").Group("model_name").Order("count DESC").Limit(10).Scan(&result.Errors).Error; err != nil {
		return nil, err
	}
	var channelRows []struct {
		ChannelID      int
		Requests       int64
		AverageLatency float64
	}
	if err := consume.Select("channel_id, COUNT(*) AS requests, COALESCE(AVG(use_time), 0) AS average_latency").Where("channel_id > ?", 0).Group("channel_id").Scan(&channelRows).Error; err != nil {
		return nil, err
	}
	var failedRows []struct {
		ChannelID      int
		FailedRequests int64
	}
	if err := errorsQuery.Select("channel_id, COUNT(*) AS failed_requests").Where("channel_id > ?", 0).Group("channel_id").Scan(&failedRows).Error; err != nil {
		return nil, err
	}
	failedByChannel := make(map[int]int64, len(failedRows))
	for _, row := range failedRows {
		failedByChannel[row.ChannelID] = row.FailedRequests
	}
	for _, row := range channelRows {
		name := strconv.Itoa(row.ChannelID)
		if channel, findErr := GetChannelById(row.ChannelID, false); findErr == nil {
			name = channel.Name
		}
		failed := failedByChannel[row.ChannelID]
		total := row.Requests + failed
		rate := 0.0
		if total > 0 {
			rate = float64(row.Requests) / float64(total)
		}
		result.Channels = append(result.Channels, AdminChannelUsage{ChannelID: row.ChannelID, ChannelName: name, Requests: total, FailedRequests: failed, SuccessRate: rate, AverageLatency: row.AverageLatency})
	}
	var errorRows []struct{ Content string }
	if err := errorsQuery.Select("content").Limit(5000).Find(&errorRows).Error; err != nil {
		return nil, err
	}
	statusCounts := make(map[string]int64)
	for _, row := range errorRows {
		match := adminHTTPStatusPattern.FindStringSubmatch(row.Content)
		status := "unknown"
		if len(match) == 2 {
			status = match[1]
		}
		statusCounts[status]++
	}
	for status, count := range statusCounts {
		result.Statuses = append(result.Statuses, AdminStatusUsage{Status: status, Count: count})
	}
	if err := DB.Model(&Redemption{}).Count(&result.Redemptions.Total).Error; err != nil {
		return nil, err
	}
	if err := DB.Model(&Redemption{}).Where("status = ?", common.RedemptionCodeStatusEnabled).Count(&result.Redemptions.Enabled).Error; err != nil {
		return nil, err
	}
	if err := DB.Model(&Redemption{}).Where("status = ?", common.RedemptionCodeStatusUsed).Count(&result.Redemptions.Used).Error; err != nil {
		return nil, err
	}
	return result, nil
}
