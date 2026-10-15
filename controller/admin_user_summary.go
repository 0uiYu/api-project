package controller

import (
	"strconv"

	"github.com/0uiYu/api-project/common"
	"github.com/0uiYu/api-project/model"
	"github.com/gin-gonic/gin"
)

func GetAdminUserSummary(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("id"))
	if err != nil || userID <= 0 {
		common.ApiErrorMsg(c, "invalid user id")
		return
	}
	if _, err := model.GetUserById(userID, false); err != nil {
		common.ApiError(c, err)
		return
	}
	summary, err := model.GetAdminUserSummary(userID)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, summary)
}
