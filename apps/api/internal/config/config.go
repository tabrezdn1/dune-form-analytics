package config

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

// DatabaseConfig holds database configuration
type DatabaseConfig struct {
	URI string `mapstructure:"uri" validate:"required"`
}

// ServerConfig holds server configuration
type ServerConfig struct {
	Port       string `mapstructure:"port" validate:"required"`
	AppName    string `mapstructure:"app_name" validate:"required"`
	BodyLimit  int    `mapstructure:"body_limit" validate:"min=1"`
}

// CORSConfig holds CORS configuration
type CORSConfig struct {
	AllowOrigins     string `mapstructure:"allow_origins" validate:"required"`
	AllowMethods     string `mapstructure:"allow_methods" validate:"required"`
	AllowHeaders     string `mapstructure:"allow_headers" validate:"required"`
	AllowCredentials bool   `mapstructure:"allow_credentials"`
}

// WebSocketConfig holds WebSocket configuration
type WebSocketConfig struct {
	BufferSize      int `mapstructure:"buffer_size" validate:"min=1"`
	ReadBufferSize  int `mapstructure:"read_buffer_size" validate:"min=1"`
	WriteBufferSize int `mapstructure:"write_buffer_size" validate:"min=1"`
}

// AuthConfig holds authentication configuration
type AuthConfig struct {
	AccessTokenSecret  string `mapstructure:"access_token_secret" validate:"required,min=32"`
	RefreshTokenSecret string `mapstructure:"refresh_token_secret" validate:"required,min=32"`
}

// Config holds all application configuration
type Config struct {
	Environment string          `mapstructure:"environment" validate:"required,oneof=development staging production"`
	Database    DatabaseConfig  `mapstructure:"database"`
	Server      ServerConfig    `mapstructure:"server"`
	CORS        CORSConfig      `mapstructure:"cors"`
	WebSocket   WebSocketConfig `mapstructure:"websocket"`
	Auth        AuthConfig      `mapstructure:"auth"`
}

// Load loads configuration from environment variables and files
func Load() (*Config, error) {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./config")

	// Set environment variable prefix
	viper.SetEnvPrefix("DUNE")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	// Set defaults
	setDefaults()

	// Try to read config file (optional)
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("failed to read config file: %w", err)
		}
		// Config file not found is OK, we'll use env vars and defaults
	}

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	return &config, nil
}

// setDefaults sets default configuration values
func setDefaults() {
	// Environment
	viper.SetDefault("environment", "development")

	// Database
	viper.SetDefault("database.uri", "mongodb://localhost:27017/dune_forms?authSource=admin")

	// Server
	viper.SetDefault("server.port", "8080")
	viper.SetDefault("server.app_name", "Dune Form Analytics API")
	viper.SetDefault("server.body_limit", 10*1024*1024) // 10MB

	// CORS
	viper.SetDefault("cors.allow_origins", "http://localhost:3000")
	viper.SetDefault("cors.allow_methods", "GET,POST,PATCH,DELETE,OPTIONS")
	viper.SetDefault("cors.allow_headers", "Origin,Content-Type,Accept,Authorization")
	viper.SetDefault("cors.allow_credentials", true)

	// WebSocket
	viper.SetDefault("websocket.buffer_size", 256)
	viper.SetDefault("websocket.read_buffer_size", 1024)
	viper.SetDefault("websocket.write_buffer_size", 1024)

	// Auth (use strong default secrets for development)
	viper.SetDefault("auth.access_token_secret", "dune_form_analytics_access_secret_key_32_chars_minimum_dev")
	viper.SetDefault("auth.refresh_token_secret", "dune_form_analytics_refresh_secret_key_32_chars_minimum_dev")
}

// GetMongoURIForLogging returns a masked MongoDB URI for logging
func (c *Config) GetMongoURIForLogging() string {
	uri := c.Database.URI
	if strings.Contains(uri, "://") {
		parts := strings.SplitN(uri, "://", 2)
		if len(parts) == 2 {
			if strings.Contains(parts[1], "@") {
				hostPart := strings.SplitN(parts[1], "@", 2)
				if len(hostPart) == 2 {
					return parts[0] + "://***@" + hostPart[1]
				}
			}
		}
	}
	return uri
}
