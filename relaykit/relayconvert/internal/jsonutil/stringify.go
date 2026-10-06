package jsonutil

import (
	"fmt"

	kitutil "github.com/0uiYu/api-project/relaykit/relayconvert/kitutil"
)

func ToJSONString(v interface{}) string {
	bytes, err := kitutil.Marshal(v)
	if err != nil {
		return fmt.Sprintf("%v", v)
	}
	return string(bytes)
}
