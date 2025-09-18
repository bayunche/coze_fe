package com.sdk.wmes.modules.task.models.DO;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sdk.wmes.modules.baseprojectinfo.models.DO.BaseProjectInfoDO;
import lombok.Data;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

/**
 * 智能体任务表实体类 (WMES_TASKS)
 */
@Data
@Entity
@Table(name = "wmes_tasks")
public class WmesTasksDO implements Serializable {

    private static final long serialVersionUID = 4578654567891L;
    /**
     * 主键ID (32位字符串)
     */
    @Id
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @GeneratedValue(generator = "uuid2")
    private String id;

    /**
     * 业务域枚举:BusinessDomainEnum类
     * @BusinessDomainEnum
     */
    @Column(name = "BUSINESS_DOMAIN" )
    private String businessDomain;

    /**
     * 处理该任务的智能体ID
     */
    @Column(name = "AGENT_INFO_ID")
    private String agentInfoId;

    /**
     * 失败处理文件数量
     */
    @Column(name = "FILE_ERROR_COUNT")
    private Integer fileErrorCount;

    /**
     * 任务下文件总数
     */
    @Column(name = "FILE_COUNT")
    private Integer fileCount;

    /**
     * 已处理文件数量
     */
    @Column(name = "FILE_DONE_COUNT")
    private Integer fileDoneCount;

    /**
     * 任务状态 (0:排队中, 1:处理中, 2:处理完成, 3:已确认, -1:错误中断)
     */
    @Column(name = "TASK_STATUS")
    private Integer taskStatus;

    /**
     * 任务优先级
     */
    @Column(name = "PRIORITY")
    private String priority;

    /**
     * 文件上传时间 (任务生成时间)
     */
    @Column(name = "UPLOAD_TIME")
    private Date uploadTime;

    /**
     * 任务开始时间
     */
    @Column(name = "START_TIME")
    private Date startTime;

    /**
     * 任务结束时间
     */
    @Column(name = "END_TIME")
    private Date endTime;

    /**
     * 错误中断原因记录
     */
    @Column(name = "ERROR_REASON")
    private String errorReason;

    /**
     * 创建人ID
     */
    @Column(name = "CREATED_BY" )
    private String createdBy;

    /**
     * 任务创建时间 (与upload_time相同)
     */
    @Column(name = "CREATED_TIME" )
    private Date createdTime;

    /**
     * 最后更新人ID
     */
    @Column(name = "UPDATED_BY")
    private String updatedBy;

    /**
     * 最后更新时间
     */
    @Column(name = "UPDATED_TIME")
    private Date updatedTime;
    
    /**
     * 审批状态 (0: 待提交审批, 1: 待审批, 2: 已审批通过, 3: 已驳回)
     */
    @Column(name = "APPROVAL_STATUS")
    private Integer approvalStatus;
    
    /**
     * 审批结果 (0: 不通过, 1: 通过)
     */
    @Column(name = "APPROVAL_RESULT")
    private Integer approvalResult;

    /**
     * 用户选择的季度
     */
    @Column(name = "SELECTED_QUARTER")
    private String selectedQuarter;

    @Transient
    private List<WmesTasksDetailDO> wmesTasksDetailDOList;

    /**
     * 关联的项目信息（非数据库字段）
     */
    @Transient
    private BaseProjectInfoDO projectInfo;
}
