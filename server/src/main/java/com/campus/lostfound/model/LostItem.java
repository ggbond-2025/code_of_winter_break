package com.campus.lostfound.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lost_items")
public class LostItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 500)
    private String description;

    /** e.g. 证件/电子产品/生活用品/书籍/其他 */
    @Column(nullable = false, length = 50)
    private String category;

    @Column(nullable = false, length = 100)
    private String location;

    @Column(nullable = false, length = 50)
    private String lostTime;

    /** LOST / FOUND */
    @Column(nullable = false, length = 20)
    private String type = "LOST";

    /** PENDING / APPROVED / REJECTED / MATCHED / CLAIMED / ARCHIVED / CANCELLED */
    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(length = 300)
    private String rejectReason;

    @Column(length = 50)
    private String contactName;

    @Column(length = 20)
    private String contactPhone;

    @Column(length = 500)
    private String features;

    @Column(length = 1000)
    private String imageUrls;

    @Column(length = 200)
    private String storageLocation;

    @Column(length = 100)
    private String archiveMethod;

    @Column(length = 200)
    private String archiveLocation;

    @Column(length = 1000)
    private String archiveImageUrls;

    private Double reward;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() { this.updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getLostTime() { return lostTime; }
    public void setLostTime(String lostTime) { this.lostTime = lostTime; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRejectReason() { return rejectReason; }
    public void setRejectReason(String rejectReason) { this.rejectReason = rejectReason; }
    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }
    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }
    public String getFeatures() { return features; }
    public void setFeatures(String features) { this.features = features; }
    public String getImageUrls() { return imageUrls; }
    public void setImageUrls(String imageUrls) { this.imageUrls = imageUrls; }
    public String getStorageLocation() { return storageLocation; }
    public void setStorageLocation(String storageLocation) { this.storageLocation = storageLocation; }
    public String getArchiveMethod() { return archiveMethod; }
    public void setArchiveMethod(String archiveMethod) { this.archiveMethod = archiveMethod; }
    public String getArchiveLocation() { return archiveLocation; }
    public void setArchiveLocation(String archiveLocation) { this.archiveLocation = archiveLocation; }
    public String getArchiveImageUrls() { return archiveImageUrls; }
    public void setArchiveImageUrls(String archiveImageUrls) { this.archiveImageUrls = archiveImageUrls; }
    public Double getReward() { return reward; }
    public void setReward(Double reward) { this.reward = reward; }
    public User getCreator() { return creator; }
    public void setCreator(User creator) { this.creator = creator; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
