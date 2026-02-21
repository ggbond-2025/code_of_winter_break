package com.campus.lostfound.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @JsonIgnore
    @Column(nullable = false, length = 100)
    private String password;

    /** USER / ADMIN / SUPER_ADMIN */
    @Column(nullable = false, length = 20)
    private String role = "USER";

    @Column(length = 30)
    private String realName;

    @Column(length = 20)
    private String phone;

    @Column(length = 18)
    private String idCard;

    @Column(length = 30)
    private String region;

    @Column(nullable = false)
    private boolean firstLogin = true;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Transient
    private Integer complaintCount;

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getRealName() { return realName; }
    public void setRealName(String realName) { this.realName = realName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getIdCard() { return idCard; }
    public void setIdCard(String idCard) { this.idCard = idCard; }
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    public boolean isFirstLogin() { return firstLogin; }
    public void setFirstLogin(boolean firstLogin) { this.firstLogin = firstLogin; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Integer getComplaintCount() { return complaintCount; }
    public void setComplaintCount(Integer complaintCount) { this.complaintCount = complaintCount; }
}
