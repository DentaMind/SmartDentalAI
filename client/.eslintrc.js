module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended"
  ],
  plugins: ["react", "@typescript-eslint", "react-hooks", "import"],
  rules: {
    // Existing rules
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    
    // Custom rule to prevent API client misuse
    "no-restricted-imports": [
      "error",
      {
        "paths": [
          {
            "name": "../../hooks/useApi",
            "message": "Do not import useApi directly. Import API from '../../lib/api' instead."
          }
        ],
        "patterns": [
          {
            "group": ["**/hooks/useApi"],
            "message": "Do not import useApi. Import API from '../../lib/api' instead."
          }
        ]
      }
    ],
    
    // Ensure we don't access .data on API responses
    "no-restricted-properties": [
      "error",
      {
        "object": "response",
        "property": "data",
        "message": "API responses don't have a .data property. Access the response directly."
      },
      {
        "object": "websocketService",
        "property": "socket",
        "message": "Do not access websocketService.socket directly. Use the provided methods instead."
      }
    ],
    
    // Ensure proper WebSocket message handling
    "@typescript-eslint/no-explicit-any": [
      "error", 
      { 
        "ignoreRestArgs": true,
        "fixToUnknown": true 
      }
    ],
    
    // Prevent direct WebSocket usage
    "no-restricted-syntax": [
      "error",
      {
        "selector": "NewExpression[callee.name='WebSocket']",
        "message": "Do not use WebSocket constructor directly. Use the websocketService instead."
      },
      {
        "selector": "MemberExpression[object.object.name='WebSocketMessageType'][property.name!=/^[A-Z_]+$/]",
        "message": "Invalid WebSocketMessageType. Use only the defined enum values."
      }
    ]
  },
  settings: {
    react: {
      version: "detect"
    }
  },
  env: {
    browser: true,
    node: true,
    es6: true
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    }
  }
}; 