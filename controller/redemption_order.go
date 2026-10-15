package controller

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/0uiYu/api-project/common"
	"github.com/0uiYu/api-project/model"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type redemptionOrderWebhookRequest struct {
	OrderId     string `json:"order_id" binding:"required"`
	Email       string `json:"email" binding:"required,email"`
	ProductName string `json:"product_name"`
	Quota       int    `json:"quota" binding:"required,gt=0"`
	Paid        bool   `json:"paid"`
}

func redemptionWebhookSecret() string {
	common.OptionMapRWMutex.RLock()
	defer common.OptionMapRWMutex.RUnlock()
	return strings.TrimSpace(common.OptionMap["RedemptionWebhookSecret"])
}

func verifyRedemptionWebhook(body []byte, signature string) bool {
	secret := redemptionWebhookSecret()
	if secret == "" || signature == "" {
		return false
	}
	h := hmac.New(sha256.New, []byte(secret))
	_, _ = h.Write(body)
	expected := hex.EncodeToString(h.Sum(nil))
	return hmac.Equal([]byte(strings.TrimSpace(strings.ToLower(signature))), []byte(expected))
}

func deliverRedemptionOrder(order *model.RedemptionOrder) error {
	if order.Status == model.RedemptionOrderDelivered {
		return nil
	}
	redemption, err := model.GetRedemptionById(order.RedemptionId)
	if err != nil {
		return err
	}
	content := fmt.Sprintf("<p>感谢购买 %s。</p><p>兑换码：</p><p><strong>%s</strong></p><p>请登录后在充值页面兑换，兑换码只能使用一次。</p>", order.ProductName, redemption.Key)
	if err := common.SendEmail("兑换码发放", order.Email, content); err != nil {
		_ = model.MarkRedemptionOrderFailed(order.Id, err.Error())
		return err
	}
	return model.MarkRedemptionOrderDelivered(order.Id)
}

// RedemptionOrderWebhook is a provider-neutral contract. The external shop
// must POST JSON with order_id, email, product_name, quota and paid=true, and
// sign the exact request body with HMAC-SHA256 using RedemptionWebhookSecret.
func RedemptionOrderWebhook(c *gin.Context) {
	body, err := io.ReadAll(io.LimitReader(c.Request.Body, 1<<20))
	if err != nil || !verifyRedemptionWebhook(body, c.GetHeader("X-Redemption-Signature")) {
		c.String(http.StatusUnauthorized, "invalid signature")
		return
	}
	var request redemptionOrderWebhookRequest
	if err := common.Unmarshal(body, &request); err != nil || !request.Paid {
		common.ApiError(c, errors.New("invalid paid order payload"))
		return
	}
	order, err := model.GetRedemptionOrder(request.OrderId)
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			common.ApiError(c, err)
			return
		}
		userId := 0
		if user, lookupErr := model.GetUniqueUserByEmail(request.Email); lookupErr == nil {
			userId = user.Id
		}
		order, err = model.CreateRedemptionOrder(request.OrderId, request.Email, request.ProductName, request.Quota, userId)
		if err != nil {
			// A concurrent retry may have created the same order; read it and
			// continue delivery instead of issuing a second code.
			order, err = model.GetRedemptionOrder(request.OrderId)
			if err != nil {
				common.ApiError(c, err)
				return
			}
		}
	}
	if err := deliverRedemptionOrder(order); err != nil {
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "order_id": order.ProviderOrderId, "status": "delivered"})
}

func GetRedemptionOrders(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)
	orders, total, err := model.SearchRedemptionOrders(c.Query("keyword"), c.Query("status"), pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(orders)
	common.ApiSuccess(c, pageInfo)
}
