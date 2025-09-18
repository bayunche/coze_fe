package com.sdk.wmes.modules.task.models.DO;

import com.sdk.wmes.modules.baseprojectinfo.models.DO.BaseProjectInfoDO;
import lombok.Data;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Date;

/**
 * 智能体任务详情表实体类 (WMES_TASKS_DETAIL)
 */
@Data
@Entity
@Table(name = "wmes_tasks_detail")
public class WmesTasksDetailDO implements Serializable {

    private static final long serialVersionUID = 1145786232454567891L;

    /**
     * 主键ID
     */
    @Id
//    @GenericGenerator(name = "uuid2", strategy = "uuid2")
//    @GeneratedValue(generator = "uuid2")
    private String id;

    /**
     * 关联的任务ID
     */
    @Column(name = "TASK_ID")
    private String taskId;

    /**
     * 任务状态 (0:排队中, 1:处理中, 2:处理完成, 3:已确认, -1:错误中断)
     */
    @Column(name = "TASK_DETAIL_STATUS")
    private Integer taskDetailStatus;

    /**
     * 错误中断原因
     */
    @Column(name = "ERROR_REASON")
    private String errorReason;

    /**
     * 任务开始时间 (varchar类型存储)
     */
    @Column(name = "START_TIME")
    private Date startTime;

    /**
     * 任务结束时间 (varchar类型存储)
     */
    @Column(name = "END_TIME")
    private Date endTime;

    /**
     * 文件处理组编号 (默认0)
     */
    @Column(name = "FILE_GROUP")
    private Integer fileGroup;

    /**
     * 创建人ID
     */
    @Column(name = "CREATED_BY")
    private String createdBy;

    /**
     * 任务生成时间 (文件上传时间)
     */
    @Column(name = "CREATED_TIME")
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
     * 文件名称
     */
    @Column(name = "FILE_NAME")
    private String fileName;
    /**
     * 文件地址
     */
    @Column(name = "FILE_URL")
    private String fileUrl;

    /**
     * 关联的项目信息（非数据库字段）
     */
    @Transient
    private BaseProjectInfoDO projectInfo;

    public boolean isEmpty() {
        if (this.id == null && this.taskId == null) {
            return true;
        }
        return false;
    }

}
