package service

import (
	"github.com/0uiYu/api-project/setting/operation_setting"
	"github.com/0uiYu/api-project/setting/system_setting"
)

func GetCallbackAddress() string {
	if operation_setting.CustomCallbackAddress == "" {
		return system_setting.ServerAddress
	}
	return operation_setting.CustomCallbackAddress
}
