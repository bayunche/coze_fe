# 文件接口 API 文档

**基础路径**: `/api/files/api/files`

---

## 1. 文件上传

上传单个文件到服务器。服务器会自动根据当前日期创建目录 (`年/月/日`)，并处理文件名冲突（例如，`file.txt` -> `file(1).txt`）。

- **URL**: `/upload`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`

### 请求参数

| 参数 | 类型 | 数据类型 | 描述 |
| --- | --- | --- | --- |
| `file` | `RequestParam` | `File` | 需要上传的文件。 |

### 成功响应 (200 OK)

返回一个包含最终文件名和相对路径的JSON对象。

**响应体示例**:
```json
{
    "fileName": "report(1).xlsx",
    "filePath": "2025/07/19/report(1).xlsx"
}
```

### 异常响应

- **400 Bad Request**: 如果文件类型不被支持 (例如, 上传 `.zip` 文件) 或文件名包含无效字符 (如 `..`)。

---

## 2. 文件下载

根据文件路径从服务器下载文件。

- **URL**: `/api/files/download`
- **Method**: `GET`

### 请求参数

| 参数 | 类型 | 数据类型 | 描述 |
| --- | --- | --- | --- |
| `filePath` | `RequestParam` | `String` | 要下载文件的相对路径，该路径由上传接口返回。 |

### 成功响应 (200 OK)

- 返回文件流，`Content-Disposition` 头被设置为 `attachment`，浏览器将提示用户下载。

### 异常响应

- **404 Not Found**: 如果在服务器上找不到 `filePath` 对应的文件。