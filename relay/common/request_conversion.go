package common

import (
	"github.com/0uiYu/api-project/relaykit/relayconvert/convmeta"
	"github.com/0uiYu/api-project/relaykit/types"
)

// GuessRelayFormatFromRequest moved to convmeta with the converters; the
// delegation keeps host callers unchanged.
func GuessRelayFormatFromRequest(req any) (types.RelayFormat, bool) {
	return convmeta.GuessRelayFormatFromRequest(req)
}

func AppendRequestConversionFromRequest(info *RelayInfo, req any) {
	if info == nil {
		return
	}
	format, ok := GuessRelayFormatFromRequest(req)
	if !ok {
		return
	}
	info.AppendRequestConversion(format)
}
