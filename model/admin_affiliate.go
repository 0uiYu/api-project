package model

type AffiliateStats struct {
	UsersWithInviter int64 `json:"users_with_inviter"`
	ActiveInviters   int64 `json:"active_inviters"`
	PendingQuota     int64 `json:"pending_quota"`
	HistoryQuota     int64 `json:"history_quota"`
}

type AffiliateTopUser struct {
	UserID       int    `json:"user_id"`
	Username     string `json:"username"`
	InviteCount  int    `json:"invite_count"`
	PendingQuota int    `json:"pending_quota"`
	HistoryQuota int    `json:"history_quota"`
}

func GetAffiliateStats() (AffiliateStats, []AffiliateTopUser, error) {
	var stats AffiliateStats
	if err := DB.Model(&User{}).Where("inviter_id > 0").Count(&stats.UsersWithInviter).Error; err != nil {
		return stats, nil, err
	}
	if err := DB.Model(&User{}).Where("aff_count > 0").Count(&stats.ActiveInviters).Error; err != nil {
		return stats, nil, err
	}
	if err := DB.Model(&User{}).Select("COALESCE(SUM(aff_quota), 0)").Scan(&stats.PendingQuota).Error; err != nil {
		return stats, nil, err
	}
	if err := DB.Model(&User{}).Select("COALESCE(SUM(aff_history), 0)").Scan(&stats.HistoryQuota).Error; err != nil {
		return stats, nil, err
	}

	top := make([]AffiliateTopUser, 0, 10)
	err := DB.Model(&User{}).
		Select("id as user_id, username, aff_count as invite_count, aff_quota as pending_quota, aff_history as history_quota").
		Where("aff_count > 0").
		Order("aff_count DESC, id ASC").
		Limit(10).
		Scan(&top).Error
	return stats, top, err
}
