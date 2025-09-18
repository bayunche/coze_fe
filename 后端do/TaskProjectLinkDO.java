package com.sdk.wmes.modules.baseprojectinfo.models.DO;

import lombok.Data;
import javax.persistence.*;
import java.io.Serializable;

@Data
@Entity
@Table(name = "wmes_task_project_link")
public class TaskProjectLinkDO implements Serializable {

    private static final long serialVersionUID = 1243423526436881L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_id", nullable = false)
    private String taskId;

    @Column(name = "base_project_info_id", nullable = false)
    private Long baseProjectInfoId;
}
