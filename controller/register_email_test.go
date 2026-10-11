package controller

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/0uiYu/api-project/common"
	"github.com/0uiYu/api-project/constant"
	"github.com/0uiYu/api-project/model"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// OWASP Authentication Cheat Sheet (account creation and authentication responses):
// email may be the username only after it is verified, comparison of the verifier
// is single-use, and the send endpoint must not reveal whether an address exists.
// ASVS 5.0 V6.2 password length stays at the existing 8–128 policy; V6.3.1
// recovery and registration verifiers are single-use and expire.
func TestRegisterRequiresVerifiedEmail(t *testing.T) {
	_, _ = setupSecurityEnrollmentTest(t)
	previousRegister := common.RegisterEnabled
	previousPasswordRegister := common.PasswordRegisterEnabled
	previousEmailVerification := common.EmailVerificationEnabled
	previousDomain := common.EmailDomainRestrictionEnabled
	previousAlias := common.EmailAliasRestrictionEnabled
	previousToken := constant.GenerateDefaultToken
	common.RegisterEnabled = true
	common.PasswordRegisterEnabled = true
	common.EmailVerificationEnabled = false
	common.EmailDomainRestrictionEnabled = false
	common.EmailAliasRestrictionEnabled = false
	constant.GenerateDefaultToken = false
	t.Cleanup(func() {
		common.RegisterEnabled = previousRegister
		common.PasswordRegisterEnabled = previousPasswordRegister
		common.EmailVerificationEnabled = previousEmailVerification
		common.EmailDomainRestrictionEnabled = previousDomain
		common.EmailAliasRestrictionEnabled = previousAlias
		constant.GenerateDefaultToken = previousToken
	})

	post := func(t *testing.T, email, password, code string) (bool, string) {
		t.Helper()
		body, err := common.Marshal(map[string]string{
			"email":             email,
			"password":          password,
			"verification_code": code,
			"username":          "ignored-name",
		})
		require.NoError(t, err)
		response := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(response)
		context.Request = httptest.NewRequest(http.MethodPost, "/api/user/register", bytes.NewReader(body))
		context.Request.Header.Set("Content-Type", "application/json")
		Register(context)
		var result struct {
			Success bool `json:"success"`
		}
		require.NoError(t, common.Unmarshal(response.Body.Bytes(), &result))
		return result.Success, response.Body.String()
	}

	t.Run("email longer than twenty characters becomes the username", func(t *testing.T) {
		const (
			email    = "longlocalpartnameextra@example.com"
			password = "correct-horse"
			code     = "24681357"
		)
		common.RegisterVerificationCodeWithKey(email, code, common.EmailVerificationPurpose)
		success, body := post(t, "LongLocalPartNameExtra@Example.com", password, code)
		require.True(t, success, body)
		assert.NotContains(t, body, code)

		stored, err := model.GetUniqueUserByEmail(email)
		require.NoError(t, err)
		assert.Equal(t, email, stored.Username)
		assert.Equal(t, email, stored.Email)
		assert.Equal(t, "longlocalpartnameext", stored.DisplayName)
		assert.Equal(t, common.RoleCommonUser, stored.Role)

		login := model.User{Username: "LONGlocalpartnameextra@example.com", Password: password}
		require.NoError(t, login.ValidateAndFill())
		assert.Equal(t, stored.Id, login.Id)

		replay, replayBody := post(t, email, password, code)
		assert.False(t, replay, replayBody)
		assert.NotContains(t, replayBody, code)
		again, err := model.GetUniqueUserByEmail(email)
		require.NoError(t, err)
		assert.Equal(t, stored.Id, again.Id)
	})

	t.Run("missing code does not create a user or burn the code", func(t *testing.T) {
		const (
			email    = "missingcode@example.com"
			password = "correct-horse"
			code     = "13572468"
		)
		common.RegisterVerificationCodeWithKey(email, code, common.EmailVerificationPurpose)
		success, body := post(t, email, password, "   ")
		assert.False(t, success, body)
		_, err := model.GetUniqueUserByEmail(email)
		require.ErrorIs(t, err, model.ErrEmailNotFound)

		success, body = post(t, email, password, code)
		require.True(t, success, body)
	})

	t.Run("wrong code creates no user", func(t *testing.T) {
		const email = "wrongcode@example.com"
		common.RegisterVerificationCodeWithKey(email, "11223344", common.EmailVerificationPurpose)
		success, body := post(t, email, "correct-horse", "00000000")
		assert.False(t, success, body)
		assert.NotContains(t, body, "11223344")
		_, err := model.GetUniqueUserByEmail(email)
		require.ErrorIs(t, err, model.ErrEmailNotFound)
	})

	t.Run("five mismatches burn the code", func(t *testing.T) {
		const (
			email = "attempts@example.com"
			code  = "99887766"
		)
		common.RegisterVerificationCodeWithKey(email, code, common.EmailVerificationPurpose)
		for range 5 {
			success, body := post(t, email, "correct-horse", "00000000")
			assert.False(t, success, body)
			assert.NotContains(t, body, code)
		}
		success, body := post(t, email, "correct-horse", code)
		assert.False(t, success, body)
		_, err := model.GetUniqueUserByEmail(email)
		require.ErrorIs(t, err, model.ErrEmailNotFound)
	})

	t.Run("expired code creates no user", func(t *testing.T) {
		previous := common.VerificationValidMinutes
		common.VerificationValidMinutes = 0
		t.Cleanup(func() { common.VerificationValidMinutes = previous })
		const email = "expired@example.com"
		common.RegisterVerificationCodeWithKey(email, "12121212", common.EmailVerificationPurpose)
		success, body := post(t, email, "correct-horse", "12121212")
		assert.False(t, success, body)
		_, err := model.GetUniqueUserByEmail(email)
		require.ErrorIs(t, err, model.ErrEmailNotFound)
	})

	t.Run("short password does not burn the code", func(t *testing.T) {
		const (
			email = "shortpass@example.com"
			code  = "55667788"
		)
		common.RegisterVerificationCodeWithKey(email, code, common.EmailVerificationPurpose)
		success, body := post(t, email, "short1", code)
		assert.False(t, success, body)
		_, err := model.GetUniqueUserByEmail(email)
		require.ErrorIs(t, err, model.ErrEmailNotFound)

		success, body = post(t, email, "correct-horse", code)
		require.True(t, success, body)
	})

	t.Run("taken address send does not issue a code", func(t *testing.T) {
		const taken = "taken@example.com"
		require.NoError(t, model.DB.Model(&model.User{}).Where("username = ?", "enrollment-user").Update("email", taken).Error)
		response := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(response)
		context.Request = httptest.NewRequest(http.MethodGet, "/api/verification?email="+url.QueryEscape(taken), nil)
		SendEmailVerification(context)
		var result struct {
			Success bool `json:"success"`
		}
		require.NoError(t, common.Unmarshal(response.Body.Bytes(), &result))
		require.True(t, result.Success, response.Body.String())

		success, body := post(t, taken, "correct-horse", "12345678")
		assert.False(t, success, body)
		stored, err := model.GetUniqueUserByEmail(taken)
		require.NoError(t, err)
		assert.Equal(t, "enrollment-user", stored.Username)

		invalid := httptest.NewRecorder()
		invalidContext, _ := gin.CreateTestContext(invalid)
		invalidContext.Request = httptest.NewRequest(http.MethodGet, "/api/verification?email=not-an-email", nil)
		SendEmailVerification(invalidContext)
		require.NoError(t, common.Unmarshal(invalid.Body.Bytes(), &result))
		assert.False(t, result.Success)
	})
}
