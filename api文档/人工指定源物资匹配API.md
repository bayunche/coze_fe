        # 人工指定源物资匹配 (V2)

        **功能描述**

        此接口用于将一个未匹配的原始物料（来自申领或用料）手动关联到一个已知的标准物料库条目（`baseDataId`）。

        **接口地址**

        `POST /materials/partya/manualMatch`

        **请求体**

        ```json
        {
          "sourceId": "e6f2b7c8-....",
          "sourceType": "requisition",
          "baseDataId": "bd-abc-123"
        }
        ```

        **请求体字段说明**

        | 字段名 | 类型 | 是否必填 | 描述 |
        | --- | --- | --- | --- |
        | `sourceId` | String | 是 | 要匹配的源记录ID（来自`queryUnmatchedSourceMaterialAPI`的响应）。 |
        | `sourceType` | String | 是 | 源记录的类型，必须是 `requisition` 或 `usage`。 |
        | `baseDataId` | String | 是 | 要关联到的目标标准物料的ID。 |

        **成功响应示例**

        ```json
        {
          "code": 200,
          "msg": "人工匹配成功，源记录已更新。",
          "data": null
        }
        ```

        **失败响应示例**

        ```json
        {
          "code": 500,
          "msg": "未找到ID为 e6f2b7c8-... 的申领记录。",
          "data": null
        }
        ```
