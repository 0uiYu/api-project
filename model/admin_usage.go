package model

type AdminUsageSummary struct {
	Requests              int64   `json:"requests"`
	SuccessfulRequests    int64   `json:"successful_requests"`
	FailedRequests        int64   `json:"failed_requests"`
	InputTokens           int64   `json:"input_tokens"`
	OutputTokens          int64   `json:"output_tokens"`
	CacheReadTokens       int64   `json:"cache_read_tokens"`
	CacheWriteTokens      int64   `json:"cache_write_tokens"`
	ChargedQuota          int64   `json:"charged_quota"`
	ReferenceCostUSD      float64 `json:"reference_cost_usd"`
	ReferenceProfitUSD    float64 `json:"reference_profit_usd"`
	CostAvailableRequests int64   `json:"cost_available_requests"`
	Users                 int64   `json:"users"`
	Channels              int64   `json:"channels"`
	RequestsPerMinute     float64 `json:"requests_per_minute"`
	TokensPerMinute       float64 `json:"tokens_per_minute"`
	AverageLatencySeconds float64 `json:"average_latency_seconds"`
}

func GetAdminUsageSummary(startTime, endTime int64) (*AdminUsageSummary, error) {
	result := &AdminUsageSummary{}
	query := LOG_DB.Model(&Log{}).
		Where("type = ? AND created_at >= ? AND created_at <= ?", LogTypeConsume, startTime, endTime)
	if err := query.Select("COUNT(*)").Scan(&result.Requests).Error; err != nil {
		return nil, err
	}
	result.SuccessfulRequests = result.Requests
	if err := LOG_DB.Model(&Log{}).
		Where("type = ? AND created_at >= ? AND created_at <= ?", LogTypeError, startTime, endTime).
		Count(&result.FailedRequests).Error; err != nil {
		return nil, err
	}
	if err := query.Select("COALESCE(SUM(input_tokens), 0)").Scan(&result.InputTokens).Error; err != nil {
		return nil, err
	}
	if err := query.Select("COALESCE(SUM(output_tokens), 0)").Scan(&result.OutputTokens).Error; err != nil {
		return nil, err
	}
	if err := query.Select("COALESCE(SUM(cache_read_tokens), 0)").Scan(&result.CacheReadTokens).Error; err != nil {
		return nil, err
	}
	if err := query.Select("COALESCE(SUM(cache_write_tokens), 0)").Scan(&result.CacheWriteTokens).Error; err != nil {
		return nil, err
	}
	if err := query.Select("COALESCE(SUM(quota), 0)").Scan(&result.ChargedQuota).Error; err != nil {
		return nil, err
	}
	if err := query.Select("COALESCE(SUM(reference_cost_usd), 0)").Where("cost_available = ?", true).Scan(&result.ReferenceCostUSD).Error; err != nil {
		return nil, err
	}
	if err := query.Select("COALESCE(SUM(reference_profit_usd), 0)").Where("cost_available = ?", true).Scan(&result.ReferenceProfitUSD).Error; err != nil {
		return nil, err
	}
	if err := query.Where("cost_available = ?", true).Count(&result.CostAvailableRequests).Error; err != nil {
		return nil, err
	}
	if err := query.Distinct("user_id").Count(&result.Users).Error; err != nil {
		return nil, err
	}
	if err := query.Where("channel_id > ?", 0).Distinct("channel_id").Count(&result.Channels).Error; err != nil {
		return nil, err
	}
	windowMinutes := float64(endTime-startTime) / 60
	if windowMinutes < 1 {
		windowMinutes = 1
	}
	totalTokens := result.InputTokens + result.OutputTokens + result.CacheReadTokens + result.CacheWriteTokens
	result.RequestsPerMinute = float64(result.Requests) / windowMinutes
	result.TokensPerMinute = float64(totalTokens) / windowMinutes
	if err := query.Select("COALESCE(AVG(use_time), 0)").Scan(&result.AverageLatencySeconds).Error; err != nil {
		return nil, err
	}
	return result, nil
}
