package controller

import (
	"github.com/0uiYu/api-project/common"
	"github.com/0uiYu/api-project/model"
	"github.com/gin-gonic/gin"
)

// GetPublicChannelStatus exposes only health metadata for the user-facing
// channel status page. Credentials, upstream URLs, groups and model lists are
// intentionally excluded.
func GetPublicChannelStatus(c *gin.Context) {
	var channels []model.Channel
	if err := model.DB.Select("id", "name", "type", "status", "test_time", "response_time").Find(&channels).Error; err != nil {
		common.ApiError(c, err)
		return
	}
	type statusRow struct {
		ID           int    `json:"id"`
		Name         string `json:"name"`
		Type         int    `json:"type"`
		Status       int    `json:"status"`
		TestTime     int64  `json:"test_time"`
		ResponseTime int    `json:"response_time"`
	}
	rows := make([]statusRow, 0, len(channels))
	for _, channel := range channels {
		rows = append(rows, statusRow{
			ID: channel.Id, Name: channel.Name, Type: channel.Type,
			Status: channel.Status, TestTime: channel.TestTime, ResponseTime: channel.ResponseTime,
		})
	}
	common.ApiSuccess(c, rows)
}
