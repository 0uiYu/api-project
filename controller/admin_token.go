package controller

import (
	"net/http"
	"strconv"

	"github.com/0uiYu/api-project/common"
	"github.com/0uiYu/api-project/model"
	"github.com/gin-gonic/gin"
)

// GetAdminTokens returns masked API keys for the administrator console.
func GetAdminTokens(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)
	keyword := c.Query("keyword")
	userID, _ := strconv.Atoi(c.Query("user_id"))

	tokens, total, err := model.GetAdminTokens(
		keyword,
		userID,
		pageInfo.GetStartIdx(),
		pageInfo.GetPageSize(),
	)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(buildMaskedTokenResponses(tokens))
	common.ApiSuccess(c, pageInfo)
}

type adminTokenStatusRequest struct {
	Status int `json:"status" binding:"required"`
}

// UpdateAdminTokenStatus enables or disables a token without exposing its key.
func UpdateAdminTokenStatus(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid token id")
		return
	}
	var request adminTokenStatusRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		common.ApiErrorMsg(c, "invalid token status")
		return
	}
	if request.Status != common.TokenStatusEnabled && request.Status != common.TokenStatusDisabled {
		common.ApiErrorMsg(c, "invalid token status")
		return
	}
	if err := model.UpdateAdminTokenStatus(id, request.Status); err != nil {
		common.ApiError(c, err)
		return
	}
	recordManageAudit(c, "token.admin_status", map[string]any{
		"token_id": id,
		"status":   request.Status,
	})
	c.Status(http.StatusNoContent)
}
