package model

import (
	"errors"

	"github.com/0uiYu/api-project/common"
	"gorm.io/gorm"
)

// GetAdminTokens returns paginated API tokens for the administrator console.
// The caller is responsible for masking the key before returning it to a client.
func GetAdminTokens(keyword string, userID, offset, limit int) ([]*Token, int64, error) {
	query := DB.Model(&Token{}).Where("tokens.deleted_at IS NULL")
	if keyword != "" {
		like := "%" + keyword + "%"
		query = query.Where("tokens.name LIKE ? OR tokens.user_id IN (SELECT id FROM users WHERE username LIKE ?)", like, like)
	}
	if userID > 0 {
		query = query.Where("tokens.user_id = ?", userID)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	items := make([]*Token, 0)
	err := query.
		Order("tokens.id DESC").
		Offset(offset).
		Limit(limit).
		Find(&items).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, 0, err
	}
	return items, total, nil
}

// UpdateAdminTokenStatus changes only the status of an existing token.
// The token key and all other user-controlled settings remain untouched.
func UpdateAdminTokenStatus(id, status int) error {
	if id <= 0 {
		return errors.New("invalid token id")
	}
	if status != common.TokenStatusEnabled && status != common.TokenStatusDisabled {
		return errors.New("invalid token status")
	}

	var token Token
	if err := DB.Select("id", "user_id").Where("id = ? AND deleted_at IS NULL", id).First(&token).Error; err != nil {
		return err
	}

	result := DB.Model(&Token{}).
		Where("id = ? AND deleted_at IS NULL", id).
		Update("status", status)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return InvalidateUserTokensCache(token.UserId)
}
