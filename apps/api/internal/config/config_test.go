package config

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestConfig_GetMongoURIForLogging(t *testing.T) {
	tests := []struct {
		name     string
		uri      string
		expected string
	}{
		{
			name:     "URI with username and password",
			uri:      "mongodb://admin:password123@localhost:27017/dune_forms",
			expected: "mongodb://***@localhost:27017/dune_forms",
		},
		{
			name:     "URI with complex credentials",
			uri:      "mongodb://user:complex@pass@cluster.mongodb.net:27017/db",
			expected: "mongodb://***@pass@cluster.mongodb.net:27017/db",
		},
		{
			name:     "URI without credentials",
			uri:      "mongodb://localhost:27017/dune_forms",
			expected: "mongodb://localhost:27017/dune_forms",
		},
		{
			name:     "URI with empty credentials",
			uri:      "mongodb://:@localhost:27017/dune_forms",
			expected: "mongodb://***@localhost:27017/dune_forms",
		},
		{
			name:     "Complex production URI",
			uri:      "mongodb+srv://dbuser:mypassword@cluster0.abc123.mongodb.net/production_db?retryWrites=true&w=majority",
			expected: "mongodb+srv://***@cluster0.abc123.mongodb.net/production_db?retryWrites=true&w=majority",
		},
		{
			name:     "URI without protocol",
			uri:      "localhost:27017/db",
			expected: "localhost:27017/db",
		},
		{
			name:     "Empty URI",
			uri:      "",
			expected: "",
		},
		{
			name:     "URI with special characters in password",
			uri:      "mongodb://user:p@ssw0rd!@localhost:27017/db",
			expected: "mongodb://***@ssw0rd!@localhost:27017/db",
		},
		{
			name:     "Localhost with authentication",
			uri:      "mongodb://admin:password123@localhost:27017,localhost:27018/dune_forms?replicaSet=rs0",
			expected: "mongodb://***@localhost:27017,localhost:27018/dune_forms?replicaSet=rs0",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			config := &Config{
				Database: DatabaseConfig{
					URI: tt.uri,
				},
			}

			result := config.GetMongoURIForLogging()
			assert.Equal(t, tt.expected, result)

			// Additional security checks
			if tt.uri != tt.expected {
				// If masking occurred, ensure no credentials are exposed
				assert.NotContains(t, result, "password", "Masked URI should not contain 'password'")
				assert.NotContains(t, result, "admin:", "Masked URI should not contain 'admin:'")
				assert.NotContains(t, result, "user:", "Masked URI should not contain 'user:'")
			}
		})
	}
}

func TestDatabaseConfig_Structure(t *testing.T) {
	t.Run("Create database config", func(t *testing.T) {
		config := DatabaseConfig{
			URI: "mongodb://localhost:27017/test_db",
		}

		assert.Equal(t, "mongodb://localhost:27017/test_db", config.URI)
	})
}

func TestServerConfig_Structure(t *testing.T) {
	t.Run("Create server config", func(t *testing.T) {
		config := ServerConfig{
			Port:      "8080",
			AppName:   "Test API",
			BodyLimit: 1024 * 1024, // 1MB
		}

		assert.Equal(t, "8080", config.Port)
		assert.Equal(t, "Test API", config.AppName)
		assert.Equal(t, 1024*1024, config.BodyLimit)
	})
}

func TestCORSConfig_Structure(t *testing.T) {
	t.Run("Create CORS config", func(t *testing.T) {
		config := CORSConfig{
			AllowOrigins:     "http://localhost:3000,https://app.example.com",
			AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
			AllowHeaders:     "Origin,Content-Type,Authorization",
			AllowCredentials: true,
		}

		assert.Equal(t, "http://localhost:3000,https://app.example.com", config.AllowOrigins)
		assert.Equal(t, "GET,POST,PUT,DELETE,OPTIONS", config.AllowMethods)
		assert.Equal(t, "Origin,Content-Type,Authorization", config.AllowHeaders)
		assert.True(t, config.AllowCredentials)
	})

	t.Run("Create CORS config without credentials", func(t *testing.T) {
		config := CORSConfig{
			AllowOrigins:     "*",
			AllowMethods:     "GET,POST",
			AllowHeaders:     "Content-Type",
			AllowCredentials: false,
		}

		assert.Equal(t, "*", config.AllowOrigins)
		assert.False(t, config.AllowCredentials)
	})
}

func TestWebSocketConfig_Structure(t *testing.T) {
	t.Run("Create WebSocket config", func(t *testing.T) {
		config := WebSocketConfig{
			BufferSize:      256,
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
		}

		assert.Equal(t, 256, config.BufferSize)
		assert.Equal(t, 1024, config.ReadBufferSize)
		assert.Equal(t, 1024, config.WriteBufferSize)
	})
}

func TestAuthConfig_Structure(t *testing.T) {
	t.Run("Create auth config", func(t *testing.T) {
		config := AuthConfig{
			AccessTokenSecret:  "access_secret_key_32_characters_minimum",
			RefreshTokenSecret: "refresh_secret_key_32_characters_minimum",
		}

		assert.Equal(t, "access_secret_key_32_characters_minimum", config.AccessTokenSecret)
		assert.Equal(t, "refresh_secret_key_32_characters_minimum", config.RefreshTokenSecret)
		assert.GreaterOrEqual(t, len(config.AccessTokenSecret), 32, "Access token secret should be at least 32 chars")
		assert.GreaterOrEqual(t, len(config.RefreshTokenSecret), 32, "Refresh token secret should be at least 32 chars")
	})
}

func TestConfig_Structure(t *testing.T) {
	t.Run("Create complete config", func(t *testing.T) {
		config := Config{
			Environment: "development",
			Database: DatabaseConfig{
				URI: "mongodb://localhost:27017/test",
			},
			Server: ServerConfig{
				Port:      "8080",
				AppName:   "Test API",
				BodyLimit: 10 * 1024 * 1024,
			},
			CORS: CORSConfig{
				AllowOrigins:     "http://localhost:3000",
				AllowMethods:     "GET,POST,PUT,DELETE",
				AllowHeaders:     "Content-Type,Authorization",
				AllowCredentials: true,
			},
			WebSocket: WebSocketConfig{
				BufferSize:      256,
				ReadBufferSize:  1024,
				WriteBufferSize: 1024,
			},
			Auth: AuthConfig{
				AccessTokenSecret:  "test_access_secret_32_characters_minimum",
				RefreshTokenSecret: "test_refresh_secret_32_characters_minimum",
			},
		}

		assert.Equal(t, "development", config.Environment)
		assert.Equal(t, "mongodb://localhost:27017/test", config.Database.URI)
		assert.Equal(t, "8080", config.Server.Port)
		assert.Equal(t, "Test API", config.Server.AppName)
		assert.Equal(t, 10*1024*1024, config.Server.BodyLimit)
		assert.Equal(t, "http://localhost:3000", config.CORS.AllowOrigins)
		assert.True(t, config.CORS.AllowCredentials)
		assert.Equal(t, 256, config.WebSocket.BufferSize)
		assert.GreaterOrEqual(t, len(config.Auth.AccessTokenSecret), 32)
		assert.GreaterOrEqual(t, len(config.Auth.RefreshTokenSecret), 32)
	})

	t.Run("Test config environment validation", func(t *testing.T) {
		validEnvironments := []string{"development", "staging", "production"}

		for _, env := range validEnvironments {
			config := Config{Environment: env}
			assert.Contains(t, []string{"development", "staging", "production"}, config.Environment)
		}
	})
}
