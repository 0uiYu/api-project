package controller

import (
	"github.com/0uiYu/api-project/common"
	"github.com/0uiYu/api-project/model"
	"github.com/gin-gonic/gin"
)

func GetAdminAffiliateStats(c *gin.Context) {
	stats, top, err := model.GetAffiliateStats()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{
		"stats": stats,
		"top":   top,
	})
}
