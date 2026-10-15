package model

// AdminUserSummary is the read-only cross-module snapshot shown to an
// administrator. Counts are deliberately computed from the source tables so
// this endpoint cannot drift into a second, manually maintained counter.
type AdminUserSummary struct {
	UserID            int   `json:"user_id"`
	TokenCount        int64 `json:"token_count"`
	ConsumeLogCount   int64 `json:"consume_log_count"`
	TopUpCount        int64 `json:"top_up_count"`
	TopUpQuota        int64 `json:"top_up_quota"`
	RedemptionCount   int64 `json:"redemption_count"`
	SubscriptionCount int64 `json:"subscription_count"`
	InvitedUserCount  int64 `json:"invited_user_count"`
	HasInviter        bool  `json:"has_inviter"`
}

func GetAdminUserSummary(userID int) (*AdminUserSummary, error) {
	result := &AdminUserSummary{UserID: userID}
	if err := DB.Model(&Token{}).Where("user_id = ?", userID).Count(&result.TokenCount).Error; err != nil {
		return nil, err
	}
	if err := LOG_DB.Model(&Log{}).Where("user_id = ? AND type = ?", userID, LogTypeConsume).Count(&result.ConsumeLogCount).Error; err != nil {
		return nil, err
	}
	if err := DB.Model(&TopUp{}).Where("user_id = ?", userID).Count(&result.TopUpCount).Error; err != nil {
		return nil, err
	}
	if err := DB.Model(&TopUp{}).Where("user_id = ?", userID).Select("COALESCE(SUM(quota), 0)").Scan(&result.TopUpQuota).Error; err != nil {
		return nil, err
	}
	if err := DB.Model(&Redemption{}).Where("user_id = ?", userID).Count(&result.RedemptionCount).Error; err != nil {
		return nil, err
	}
	if err := DB.Model(&UserSubscription{}).Where("user_id = ?", userID).Count(&result.SubscriptionCount).Error; err != nil {
		return nil, err
	}
	if err := DB.Model(&User{}).Where("inviter_id = ?", userID).Count(&result.InvitedUserCount).Error; err != nil {
		return nil, err
	}
	var inviterID int
	if err := DB.Model(&User{}).Where("id = ?", userID).Select("inviter_id").Scan(&inviterID).Error; err != nil {
		return nil, err
	}
	result.HasInviter = inviterID > 0
	return result, nil
}
