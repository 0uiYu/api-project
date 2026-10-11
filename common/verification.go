package common

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"errors"
	"math/big"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

type verificationValue struct {
	hash     [sha256.Size]byte
	time     time.Time
	failures int
}

const verificationAttemptLimit = 5

const (
	EmailVerificationPurpose = "v"
	PasswordResetPurpose     = "r"
)

var verificationMutex sync.Mutex
var verificationMap map[string]verificationValue
var verificationMapMaxSize = 10
var VerificationValidMinutes = 10

func GenerateVerificationCode(length int) string {
	code := uuid.New().String()
	code = strings.Replace(code, "-", "", -1)
	if length == 0 {
		return code
	}
	return code[:length]
}

func GenerateNumericVerificationCode(length int) (string, error) {
	if length < 6 || length > 12 {
		return "", errors.New("invalid verification code length")
	}
	var code strings.Builder
	for range length {
		number, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			return "", err
		}
		code.WriteByte(byte('0' + number.Int64()))
	}
	return code.String(), nil
}

func RegisterVerificationCodeWithKey(key string, code string, purpose string) {
	verificationMutex.Lock()
	defer verificationMutex.Unlock()
	verificationMap[purpose+key] = verificationValue{
		hash: sha256.Sum256([]byte(code)),
		time: time.Now(),
	}
	if len(verificationMap) > verificationMapMaxSize {
		removeExpiredPairs()
	}
}

func VerifyCodeWithKey(key string, code string, purpose string) bool {
	presented := sha256.Sum256([]byte(code))
	verificationMutex.Lock()
	defer verificationMutex.Unlock()
	value, okay := verificationMap[purpose+key]
	if !okay || int(time.Since(value.time).Seconds()) >= VerificationValidMinutes*60 {
		return false
	}
	if subtle.ConstantTimeCompare(value.hash[:], presented[:]) != 1 {
		value.failures++
		if value.failures >= verificationAttemptLimit {
			delete(verificationMap, purpose+key)
			return false
		}
		verificationMap[purpose+key] = value
		return false
	}
	delete(verificationMap, purpose+key)
	return true
}

func DeleteKey(key string, purpose string) {
	verificationMutex.Lock()
	defer verificationMutex.Unlock()
	delete(verificationMap, purpose+key)
}

// no lock inside, so the caller must lock the verificationMap before calling!
func removeExpiredPairs() {
	now := time.Now()
	for key := range verificationMap {
		if int(now.Sub(verificationMap[key].time).Seconds()) >= VerificationValidMinutes*60 {
			delete(verificationMap, key)
		}
	}
}

func init() {
	verificationMutex.Lock()
	defer verificationMutex.Unlock()
	verificationMap = make(map[string]verificationValue)
}
