package com.sdk.wmes.modules.baseprojectinfo.models.DO;

import lombok.Data;
import javax.persistence.*;
import java.io.Serializable;

/**
 * 项目基础信息实体类
 * 
 * 用于存储项目、工程和合同的基础信息，包括项目基本信息、工程基本信息、
 * 合同基本信息。该实体类支持项目全生命周期管理。
 * 
 * @author Claude
 * @version 1.1.2
 * @since 2024-01-15
 */
@Data
@Entity
@Table(name = "wmes_base_project_info")
public class BaseProjectInfoDO implements Serializable {

    private static final long serialVersionUID = 132342345L;

    /**
     * 主键ID，自增长
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 项目名称
     */
    @Column(name = "project_name")
    private String projectName;

    /**
     * 项目编码，具有唯一性约束
     */
    @Column(name = "project_code", unique = true)
    private String projectCode;

    /**
     * 工程名称
     */
    @Column(name = "engineering_name")
    private String engineeringName;

    /**
     * 工程编码，具有唯一性约束
     */
    @Column(name = "engineering_code", unique = true)
    private String engineeringCode;

    /**
     * 合同编码
     */
    @Column(name = "contract_code")
    private String contractCode;

    /**
     * 合同名称
     */
    @Column(name = "contract_name")
    private String contractName;
}
