// Package docs Code generated by swaggo/swag. DO NOT EDIT
package docs

import "github.com/swaggo/swag"

const docTemplate = `{
    "schemes": {{ marshal .Schemes }},
    "swagger": "2.0",
    "info": {
        "description": "{{escape .Description}}",
        "title": "{{.Title}}",
        "contact": {},
        "version": "{{.Version}}"
    },
    "host": "{{.Host}}",
    "basePath": "{{.BasePath}}",
    "paths": {
        "/accounts": {
            "put": {
                "description": "アカウントを更新する",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "accounts"
                ],
                "summary": "アカウント更新",
                "parameters": [
                    {
                        "description": "アカウント情報",
                        "name": "account",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/handlers.AccountCreateRequest"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "成功",
                        "schema": {
                            "$ref": "#/definitions/handlers.AccountResponse"
                        }
                    },
                    "400": {
                        "description": "リクエストデータが不正です",
                        "schema": {
                            "$ref": "#/definitions/handlers.ErrorResponse"
                        }
                    },
                    "500": {
                        "description": "データベース接続に失敗しました",
                        "schema": {
                            "$ref": "#/definitions/handlers.ErrorResponse"
                        }
                    }
                }
            },
            "post": {
                "description": "アカウントを作成する",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "accounts"
                ],
                "summary": "アカウント作成",
                "parameters": [
                    {
                        "description": "アカウント情報",
                        "name": "account",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/handlers.AccountCreateRequest"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "成功",
                        "schema": {
                            "$ref": "#/definitions/handlers.AccountResponse"
                        }
                    },
                    "400": {
                        "description": "リクエストデータが不正です",
                        "schema": {
                            "$ref": "#/definitions/handlers.ErrorResponse"
                        }
                    },
                    "500": {
                        "description": "データベース接続に失敗しました",
                        "schema": {
                            "$ref": "#/definitions/handlers.ErrorResponse"
                        }
                    }
                }
            },
            "delete": {
                "description": "アカウントを削除する",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "accounts"
                ],
                "summary": "アカウント削除",
                "parameters": [
                    {
                        "description": "アカウント情報",
                        "name": "account",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/handlers.DeleteAccountCreateRequest"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "成功",
                        "schema": {
                            "$ref": "#/definitions/handlers.AccountResponse"
                        }
                    },
                    "400": {
                        "description": "リクエストデータが不正です",
                        "schema": {
                            "$ref": "#/definitions/handlers.ErrorResponse"
                        }
                    },
                    "500": {
                        "description": "データベース接続に失敗しました",
                        "schema": {
                            "$ref": "#/definitions/handlers.ErrorResponse"
                        }
                    }
                }
            }
        },
        "/accounts/{passerID}": {
            "get": {
                "description": "ユーザが開示しているアカウント一覧を取得する",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "accounts"
                ],
                "summary": "アカウント一覧取得",
                "parameters": [
                    {
                        "type": "string",
                        "description": "パスワードを取得するユーザのID",
                        "name": "passerID",
                        "in": "query",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "成功",
                        "schema": {
                            "type": "array",
                            "items": {
                                "$ref": "#/definitions/handlers.AccountResponse"
                            }
                        }
                    },
                    "400": {
                        "description": "リクエストデータが不正です",
                        "schema": {
                            "$ref": "#/definitions/handlers.ErrorResponse"
                        }
                    },
                    "500": {
                        "description": "データベース接続に失敗しました",
                        "schema": {
                            "$ref": "#/definitions/handlers.ErrorResponse"
                        }
                    }
                }
            }
        },
        "/devices": {
            "put": {
                "description": "デバイスを更新する",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "devices"
                ],
                "summary": "デバイス更新",
                "parameters": [
                    {
                        "description": "デバイス情報",
                        "name": "device",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/handlers.DeviceCreateRequest"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "成功",
                        "schema": {
                            "$ref": "#/definitions/handlers.DeviceResponse"
                        }
                    },
                    "400": {
                        "description": "リクエストデータが不正です",
                        "schema": {
                            "$ref": "#/definitions/handlers.ErrorResponse"
                        }
                    },
                    "500": {
                        "description": "データベース接続に失敗しました",
                        "schema": {
                            "$ref": "#/definitions/handlers.ErrorResponse"
                        }
                    }
                }
            },
            "post": {
                "description": "デバイスを追加する",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "devices"
                ],
                "summary": "デバイス追加",
                "parameters": [
                    {
                        "description": "デバイス情報",
                        "name": "device",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/handlers.DeviceCreateRequest"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "成功",
                        "schema": {
                            "$ref": "#/definitions/handlers.DeviceResponse"
                        }
                    },
                    "400": {
                        "description": "リクエストデータが不正です",
                        "schema": {
                            "$ref": "#/definitions/handlers.ErrorResponse"
                        }
                    },
                    "500": {
                        "description": "データベース接続に失敗しました",
                        "schema": {
                            "$ref": "#/definitions/handlers.ErrorResponse"
                        }
                    }
                }
            },
            "delete": {
                "description": "デバイスを削除する",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "devices"
                ],
                "summary": "デバイス削除",
                "parameters": [
                    {
                        "description": "デバイス情報",
                        "name": "device",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/handlers.DeleteDeviceCreateRequest"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "成功",
                        "schema": {
                            "$ref": "#/definitions/handlers.DeviceResponse"
                        }
                    },
                    "400": {
                        "description": "リクエストデータが不正です",
                        "schema": {
                            "$ref": "#/definitions/handlers.ErrorResponse"
                        }
                    },
                    "500": {
                        "description": "データベース接続に失敗しました",
                        "schema": {
                            "$ref": "#/definitions/handlers.ErrorResponse"
                        }
                    }
                }
            }
        },
        "/devices/{passerID}": {
            "get": {
                "description": "ユーザが開示しているデバイス一覧を取得する",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "devices"
                ],
                "summary": "デバイス一覧取得",
                "parameters": [
                    {
                        "type": "string",
                        "description": "デバイスを取得するユーザのID",
                        "name": "passerID",
                        "in": "query",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "成功",
                        "schema": {
                            "type": "array",
                            "items": {
                                "$ref": "#/definitions/handlers.DeviceResponse"
                            }
                        }
                    },
                    "400": {
                        "description": "リクエストデータが不正です",
                        "schema": {
                            "$ref": "#/definitions/handlers.ErrorResponse"
                        }
                    },
                    "500": {
                        "description": "データベース接続に失敗しました",
                        "schema": {
                            "$ref": "#/definitions/handlers.ErrorResponse"
                        }
                    }
                }
            }
        },
        "/users": {
            "put": {
                "description": "clerkでユーザ認証した後にバックエンドのDBにユーザを更新するためのエンドポイント",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "users"
                ],
                "summary": "ユーザ更新",
                "parameters": [
                    {
                        "description": "ユーザ情報",
                        "name": "user",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/handlers.UserCreateRequest"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "成功",
                        "schema": {
                            "$ref": "#/definitions/handlers.UserResponse"
                        }
                    },
                    "400": {
                        "description": "リクエストデータが不正です",
                        "schema": {
                            "$ref": "#/definitions/handlers.ErrorResponse"
                        }
                    },
                    "500": {
                        "description": "データベース接続に失敗しました",
                        "schema": {
                            "$ref": "#/definitions/handlers.ErrorResponse"
                        }
                    }
                }
            },
            "post": {
                "description": "clerkでユーザ認証した後にバックエンドのDBにユーザを登録するためのエンドポイント",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "users"
                ],
                "summary": "ユーザ登録",
                "parameters": [
                    {
                        "description": "ユーザ情報",
                        "name": "user",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/handlers.UserCreateRequest"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "成功",
                        "schema": {
                            "$ref": "#/definitions/handlers.UserResponse"
                        }
                    },
                    "400": {
                        "description": "リクエストデータが不正です",
                        "schema": {
                            "$ref": "#/definitions/handlers.ErrorResponse"
                        }
                    },
                    "500": {
                        "description": "データベース接続に失敗しました",
                        "schema": {
                            "$ref": "#/definitions/handlers.ErrorResponse"
                        }
                    }
                }
            }
        }
    },
    "definitions": {
        "handlers.AccountCreateRequest": {
            "type": "object",
            "properties": {
                "accountUsername": {
                    "type": "string"
                },
                "appDescription": {
                    "type": "string"
                },
                "appIconUrl": {
                    "type": "string"
                },
                "appName": {
                    "type": "string"
                },
                "appTemplateID": {
                    "type": "integer"
                },
                "customData": {
                    "type": "array",
                    "items": {
                        "type": "integer"
                    }
                },
                "memo": {
                    "type": "string"
                },
                "message": {
                    "type": "string"
                },
                "passerID": {
                    "type": "string"
                },
                "password": {
                    "type": "string"
                },
                "plsDelete": {
                    "type": "boolean"
                }
            }
        },
        "handlers.AccountResponse": {
            "type": "object",
            "properties": {
                "accountUsername": {
                    "type": "string"
                },
                "appDescription": {
                    "type": "string"
                },
                "appIconUrl": {
                    "type": "string"
                },
                "appName": {
                    "type": "string"
                },
                "appTemplateID": {
                    "type": "integer"
                },
                "customData": {
                    "type": "array",
                    "items": {
                        "type": "integer"
                    }
                },
                "encPassword": {
                    "type": "array",
                    "items": {
                        "type": "integer"
                    }
                },
                "id": {
                    "type": "integer"
                },
                "isDisclosed": {
                    "type": "boolean"
                },
                "memo": {
                    "type": "string"
                },
                "message": {
                    "type": "string"
                },
                "passerID": {
                    "type": "string"
                },
                "plsDelete": {
                    "type": "boolean"
                },
                "trustID": {
                    "type": "integer"
                }
            }
        },
        "handlers.DeleteAccountCreateRequest": {
            "type": "object",
            "properties": {
                "deviceID": {
                    "type": "integer"
                },
                "passerID": {
                    "type": "string"
                }
            }
        },
        "handlers.DeleteDeviceCreateRequest": {
            "type": "object",
            "properties": {
                "deviceID": {
                    "type": "integer"
                },
                "passerID": {
                    "type": "string"
                }
            }
        },
        "handlers.DeviceCreateRequest": {
            "type": "object",
            "properties": {
                "credentialType": {
                    "type": "integer"
                },
                "customData": {
                    "type": "array",
                    "items": {
                        "type": "integer"
                    }
                },
                "deviceDescription": {
                    "type": "string"
                },
                "deviceType": {
                    "type": "integer"
                },
                "deviceUsername": {
                    "type": "string"
                },
                "memo": {
                    "type": "string"
                },
                "message": {
                    "type": "string"
                },
                "passerID": {
                    "type": "string"
                },
                "password": {
                    "type": "string"
                }
            }
        },
        "handlers.DeviceResponse": {
            "type": "object",
            "properties": {
                "credentialType": {
                    "type": "integer"
                },
                "customData": {
                    "type": "array",
                    "items": {
                        "type": "integer"
                    }
                },
                "deviceDescription": {
                    "type": "string"
                },
                "deviceType": {
                    "type": "integer"
                },
                "deviceUsername": {
                    "type": "string"
                },
                "encPassword": {
                    "type": "string"
                },
                "id": {
                    "type": "integer"
                },
                "memo": {
                    "type": "string"
                },
                "message": {
                    "type": "string"
                },
                "passerID": {
                    "type": "string"
                },
                "trustID": {
                    "type": "integer"
                }
            }
        },
        "handlers.ErrorResponse": {
            "type": "object",
            "properties": {
                "details": {
                    "type": "string"
                },
                "error": {
                    "type": "string"
                }
            }
        },
        "handlers.UserCreateRequest": {
            "type": "object",
            "properties": {
                "clerkUserID": {
                    "type": "string"
                },
                "defaultReceiverID": {
                    "type": "string"
                }
            }
        },
        "handlers.UserResponse": {
            "type": "object",
            "properties": {
                "clerkUserID": {
                    "type": "string"
                },
                "defaultReceiverID": {
                    "type": "string"
                },
                "userID": {
                    "type": "string"
                }
            }
        }
    }
}`

// SwaggerInfo holds exported Swagger Info so clients can modify it
var SwaggerInfo = &swag.Spec{
	Version:          "",
	Host:             "",
	BasePath:         "",
	Schemes:          []string{},
	Title:            "",
	Description:      "",
	InfoInstanceName: "swagger",
	SwaggerTemplate:  docTemplate,
	LeftDelim:        "{{",
	RightDelim:       "}}",
}

func init() {
	swag.Register(SwaggerInfo.InstanceName(), SwaggerInfo)
}
