package controller

import (
	"strconv"

	"github.com/0uiYu/api-project/common"
	"github.com/0uiYu/api-project/model"
	"github.com/gin-gonic/gin"
)

func GetAdminUsageSummary(c *gin.Context) {
	startTime, endTime, ok := resolveAdminUsageWindow(c)
	if !ok {
		return
	}
	data, err := model.GetAdminUsageSummary(startTime, endTime)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, data)
}

// resolveAdminUsageWindow accepts either an explicit start_timestamp /
// end_timestamp window or the `hours` shortcut. The explicit form lets the
// model analysis page ask for exactly the range it is charting, so its cards
// count the same settled log rows as the operations overview.
func resolveAdminUsageWindow(c *gin.Context) (int64, int64, bool) {
	if raw := c.Query("start_timestamp"); raw != "" {
		startTime, startErr := strconv.ParseInt(raw, 10, 64)
		endTime, endErr := strconv.ParseInt(c.Query("end_timestamp"), 10, 64)
		if startErr != nil || endErr != nil || startTime <= 0 || endTime < startTime {
			common.ApiErrorMsg(c, "invalid start_timestamp/end_timestamp")
			return 0, 0, false
		}
		return startTime, endTime, true
	}
	hours := 24
	if raw := c.Query("hours"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed < 1 || parsed > 720 {
			common.ApiErrorMsg(c, "hours must be between 1 and 720")
			return 0, 0, false
		}
		hours = parsed
	}
	now := common.GetTimestamp()
	return now - int64(hours)*3600, now, true
}

func GetAdminOperationsOverview(c *gin.Context) {
	hours := 24
	if raw := c.Query("hours"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed < 1 || parsed > 720 {
			common.ApiErrorMsg(c, "hours must be between 1 and 720")
			return
		}
		hours = parsed
	}
	now := common.GetTimestamp()
	data, err := model.GetAdminOperationsOverview(now-int64(hours)*3600, now)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, data)
}

func GetAdminOperationsTrend(c *gin.Context) {
	hours := 24
	if raw := c.Query("hours"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed < 1 || parsed > 720 {
			common.ApiErrorMsg(c, "hours must be between 1 and 720")
			return
		}
		hours = parsed
	}
	now := common.GetTimestamp()
	data, err := model.GetAdminOperationsTrend(now-int64(hours)*3600, now, int64(hours)*3600/24)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, data)
}
