package model

import (
	"errors"
	"strconv"
	"strings"

	"github.com/0uiYu/api-project/common"
	"gorm.io/gorm"
)

const (
	RedemptionOrderPending   = 0
	RedemptionOrderDelivered = 1
	RedemptionOrderFailed    = 2
)

type RedemptionOrder struct {
	Id               int    `json:"id"`
	ProviderOrderId  string `json:"provider_order_id" gorm:"size:128;uniqueIndex"`
	Email            string `json:"email" gorm:"size:320;index"`
	ProductName      string `json:"product_name" gorm:"size:128"`
	Quota            int    `json:"quota"`
	RedemptionId     int    `json:"redemption_id" gorm:"index"`
	Status           int    `json:"status" gorm:"index"`
	DeliveryAttempts int    `json:"delivery_attempts"`
	LastError        string `json:"last_error" gorm:"type:text"`
	CreatedTime      int64  `json:"created_time" gorm:"bigint"`
	DeliveredTime    int64  `json:"delivered_time" gorm:"bigint"`
}

func GetRedemptionOrder(providerOrderId string) (*RedemptionOrder, error) {
	var order RedemptionOrder
	err := DB.Where("provider_order_id = ?", providerOrderId).First(&order).Error
	return &order, err
}

func SearchRedemptionOrders(keyword, status string, startIdx, limit int) ([]*RedemptionOrder, int64, error) {
	query := DB.Model(&RedemptionOrder{})
	if keyword != "" {
		query = query.Where("provider_order_id LIKE ? OR email LIKE ?", keyword+"%", keyword+"%")
	}
	if status != "" {
		statusCode, err := strconv.Atoi(status)
		if err != nil || statusCode < RedemptionOrderPending || statusCode > RedemptionOrderFailed {
			return nil, 0, errors.New("invalid redemption order status")
		}
		query = query.Where("status = ?", statusCode)
	}
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var orders []*RedemptionOrder
	if err := query.Order("id desc").Offset(startIdx).Limit(limit).Find(&orders).Error; err != nil {
		return nil, 0, err
	}
	return orders, total, nil
}

func CreateRedemptionOrder(providerOrderId, email, productName string, quota, userId int) (*RedemptionOrder, error) {
	providerOrderId = strings.TrimSpace(providerOrderId)
	email = NormalizeEmail(email)
	if providerOrderId == "" || email == "" || quota <= 0 {
		return nil, errors.New("invalid redemption order")
	}
	order := &RedemptionOrder{}
	err := DB.Transaction(func(tx *gorm.DB) error {
		order = &RedemptionOrder{
			ProviderOrderId: providerOrderId,
			Email:           email,
			ProductName:     productName,
			Quota:           quota,
			Status:          RedemptionOrderPending,
			CreatedTime:     common.GetTimestamp(),
		}
		if err := tx.Create(order).Error; err != nil {
			return err
		}
		redemption := &Redemption{
			UserId: userId, Name: productName, Key: common.GetUUID(),
			Quota: quota, CreatedTime: order.CreatedTime,
		}
		if err := tx.Create(redemption).Error; err != nil {
			return err
		}
		order.RedemptionId = redemption.Id
		return tx.Model(order).Update("redemption_id", redemption.Id).Error
	})
	if err != nil {
		return nil, err
	}
	return order, nil
}

func MarkRedemptionOrderDelivered(id int) error {
	return DB.Model(&RedemptionOrder{}).Where("id = ?", id).Updates(map[string]any{
		"status":         RedemptionOrderDelivered,
		"delivered_time": common.GetTimestamp(),
		"last_error":     "",
	}).Error
}

func MarkRedemptionOrderFailed(id int, deliveryError string) error {
	return DB.Model(&RedemptionOrder{}).Where("id = ?", id).Updates(map[string]any{
		"status":            RedemptionOrderFailed,
		"delivery_attempts": gorm.Expr("delivery_attempts + 1"),
		"last_error":        deliveryError,
	}).Error
}
