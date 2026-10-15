package model

import (
	"testing"

	"github.com/0uiYu/api-project/common"
	"github.com/0uiYu/api-project/constant"

	"github.com/stretchr/testify/require"
)

// The overview must separate settled tasks from ones still in flight, and the
// stuck count must match the predicate the timeout sweeper acts on
// (model.GetTimedOutUnfinishedTasks) rather than counting every unfinished row.
func TestGetAdminTaskUsageSplitsTasksByState(t *testing.T) {
	truncateTables(t)
	previousTimeout := constant.TaskTimeoutMinutes
	constant.TaskTimeoutMinutes = 60
	t.Cleanup(func() { constant.TaskTimeoutMinutes = previousTimeout })

	now := common.GetTimestamp()
	day := int64(86400)
	seed := []Task{
		{TaskID: "usage-success", Platform: "s2v", CreatedAt: now - 600, Status: TaskStatusSuccess, Progress: "100%", SubmitTime: now - 900},
		{TaskID: "usage-failure", Platform: "s2v", CreatedAt: now - 500, Status: TaskStatusFailure, Progress: "100%", SubmitTime: now - 800},
		{TaskID: "usage-running-fresh", Platform: "s2v", CreatedAt: now - 300, Status: TaskStatusInProgress, Progress: "40%", SubmitTime: now - 1800},
		{TaskID: "usage-queued", Platform: "s2v", CreatedAt: now - 200, Status: TaskStatusQueued, Progress: "0%", SubmitTime: now - 200},
		// Outside the range and past the timeout: the sweeper's target.
		{TaskID: "usage-stuck", Platform: "s2v", CreatedAt: now - 2*day, Status: TaskStatusInProgress, Progress: "50%", SubmitTime: now - 7200},
		// Outside the range and past the timeout, but progress finished.
		{TaskID: "usage-finished-progress", Platform: "s2v", CreatedAt: now - 2*day, Status: TaskStatusInProgress, Progress: "100%", SubmitTime: now - 7200},
	}
	for i := range seed {
		require.NoError(t, DB.Create(&seed[i]).Error)
	}

	usage, err := GetAdminTaskUsage(now-3600, now)
	require.NoError(t, err)
	require.Equal(t, AdminTaskUsage{
		Total:     4,
		Running:   2,
		Succeeded: 1,
		Failed:    1,
		Stuck:     1,
	}, usage)
}
