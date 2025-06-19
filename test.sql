INSERT INTO WMES_TASKS (
  ID,
  BUSINESS_DOMAIN,
  agent_info_id,
  file_error_count,
  file_count,
  file_done_count,
  task_status,
  priority,
  upload_time,
  start_time,
  end_time,
  ERROR_REASON,
  CREATED_BY,
  CREATED_TIME,
  UPDATED_BY,
  UPDATED_TIME
) VALUES (
  '',   -- ID
  'contract',                           -- 业务域
  '1',                          -- 智能体ID
  0,                                    -- 失败处理数
  10,                                   -- 文件总数
  0,                                    -- 已处理数
  0,                                    -- 状态：排队中
  '',                               -- 优先级
  NOW(),                                -- 上传时间
  NOW(),                                 -- 开始时间
  NULL,                                 -- 结束时间
  NULL,                                 -- 错误原因
  'system',                             -- 创建人
  NOW(),                                -- 创建时间
  'system',                             -- 更新人
  NOW()                                 -- 更新时间
);