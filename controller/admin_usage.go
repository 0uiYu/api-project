package controller

import (
	"strconv"

	"github.com/0uiYu/api-project/common"
	"github.com/0uiYu/api-project/model"
	"github.com/gin-gonic/gin"
)

func GetAdminUsageSummary(c *gin.Context) {
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
	data, err := model.GetAdminUsageSummary(now-int64(hours)*3600, now)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, data)
}
