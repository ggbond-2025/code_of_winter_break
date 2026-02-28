package com.campus.lostfound.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "system_config")
public class SystemConfig {

    @Id
    private Long id = 1L;

    @Column(nullable = false, length = 500)
    private String categories;

    @Column(nullable = false)
    private Integer claimExpireDays = 30;

    @Column(nullable = false)
    private Integer publishCooldownMinutes = 5;

    @Column(nullable = false)
    private Integer maxChatPerUser = 50;

    @Column(nullable = false)
    private boolean forbidWordCheck = true;

    @Column(nullable = false, length = 2000)
    private String forbiddenWords = "广告,代购,赌博,色情,诈骗";

    @Column(nullable = false)
    private boolean requireImage = false;

    @Column(nullable = false)
    private boolean requireLocationDetail = true;

    @Column(nullable = false)
    private boolean enableReview = true;

    @Column(nullable = false)
    private boolean enableDescLimit = false;

    @Column(nullable = false)
    private Integer descMaxLength = 200;

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() { this.updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public String getCategories() { return categories; }
    public void setCategories(String categories) { this.categories = categories; }
    public Integer getClaimExpireDays() { return claimExpireDays; }
    public void setClaimExpireDays(Integer claimExpireDays) { this.claimExpireDays = claimExpireDays; }
    public Integer getPublishCooldownMinutes() { return publishCooldownMinutes; }
    public void setPublishCooldownMinutes(Integer publishCooldownMinutes) { this.publishCooldownMinutes = publishCooldownMinutes; }
    public Integer getMaxChatPerUser() { return maxChatPerUser; }
    public void setMaxChatPerUser(Integer maxChatPerUser) { this.maxChatPerUser = maxChatPerUser; }
    public boolean isForbidWordCheck() { return forbidWordCheck; }
    public void setForbidWordCheck(boolean forbidWordCheck) { this.forbidWordCheck = forbidWordCheck; }
    public String getForbiddenWords() { return forbiddenWords; }
    public void setForbiddenWords(String forbiddenWords) { this.forbiddenWords = forbiddenWords; }
    public boolean isRequireImage() { return requireImage; }
    public void setRequireImage(boolean requireImage) { this.requireImage = requireImage; }
    public boolean isRequireLocationDetail() { return requireLocationDetail; }
    public void setRequireLocationDetail(boolean requireLocationDetail) { this.requireLocationDetail = requireLocationDetail; }
    public boolean isEnableReview() { return enableReview; }
    public void setEnableReview(boolean enableReview) { this.enableReview = enableReview; }
    public boolean isEnableDescLimit() { return enableDescLimit; }
    public void setEnableDescLimit(boolean enableDescLimit) { this.enableDescLimit = enableDescLimit; }
    public Integer getDescMaxLength() { return descMaxLength; }
    public void setDescMaxLength(Integer descMaxLength) { this.descMaxLength = descMaxLength; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
