package com.campus.lostfound.service.impl;

import com.campus.lostfound.model.Announcement;
import com.campus.lostfound.model.User;
import com.campus.lostfound.repository.AnnouncementRepository;
import com.campus.lostfound.repository.ComplaintRecordRepository;
import com.campus.lostfound.repository.LostItemRepository;
import com.campus.lostfound.repository.UserRepository;
import com.campus.lostfound.service.SuperAdminService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class SuperAdminServiceImpl implements SuperAdminService {

    private static final DateTimeFormatter BACKUP_DIR_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");
    private static final DateTimeFormatter DISPLAY_FORMATTER = DateTimeFormatter.ofPattern("yyyy年M月d日 HH:mm:ss");
    private static final List<String> CLEANUP_STATUSES = List.of("ARCHIVED", "ADMIN_DELETED", "CLAIMED");

    private final UserRepository userRepository;
    private final AnnouncementRepository announcementRepository;
    private final LostItemRepository lostItemRepository;
    private final ComplaintRecordRepository complaintRecordRepository;
    private final PasswordEncoder passwordEncoder;
    private final DataSource dataSource;
    private final String backupOutputDir;
    private final String uploadDir;

    public SuperAdminServiceImpl(UserRepository userRepository,
                                 AnnouncementRepository announcementRepository,
                                 LostItemRepository lostItemRepository,
                                 ComplaintRecordRepository complaintRecordRepository,
                                 PasswordEncoder passwordEncoder,
                                 DataSource dataSource,
                                 @Value("${backup.output-dir:backups/sql}") String backupOutputDir,
                                 @Value("${file.upload-dir:uploads}") String uploadDir) {
        this.userRepository = userRepository;
        this.announcementRepository = announcementRepository;
        this.lostItemRepository = lostItemRepository;
        this.complaintRecordRepository = complaintRecordRepository;
        this.passwordEncoder = passwordEncoder;
        this.dataSource = dataSource;
        this.backupOutputDir = backupOutputDir;
        this.uploadDir = uploadDir;
    }

    @Override
    public Page<User> listUsers(String keyword, String role, int page, int size) {
        Page<User> res = userRepository.search(keyword, role, PageRequest.of(page, size));
        res.getContent().forEach(u -> u.setComplaintCount((int) complaintRecordRepository.countByTargetId(u.getId())));
        return res;
    }

    @Override
    public User createAdmin(String username, String password, String realName, String phone, String region) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("用户名已存在");
        }
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole("ADMIN");
        user.setRealName(realName);
        user.setPhone(phone);
        user.setRegion(region);
        user.setFirstLogin(true);
        return userRepository.save(user);
    }

    @Override
    public User toggleUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        user.setEnabled(!user.isEnabled());
        return userRepository.save(user);
    }

    @Override
    public void resetPassword(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        user.setPassword(passwordEncoder.encode("123456"));
        user.setFirstLogin(true);
        userRepository.save(user);
    }

    @Override
    public List<Announcement> allAnnouncements() {
        return announcementRepository.findAll();
    }

    @Override
    public Announcement createAnnouncement(Long authorId, String title, String content) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        Announcement a = new Announcement();
        a.setTitle(title);
        a.setContent(content);
        a.setAuthor(author);
        a.setScope("GLOBAL");
        a.setStatus("APPROVED");
        a.setActive(true);
        return announcementRepository.save(a);
    }

    @Override
    public List<Announcement> pendingRegionAnnouncements() {
        return announcementRepository.findByScopeAndStatusOrderByCreatedAtDesc("REGION", "PENDING");
    }

    @Override
    public Announcement approveRegionAnnouncement(Long announcementId) {
        Announcement a = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new IllegalArgumentException("公告不存在"));
        if (!"REGION".equals(a.getScope())) {
            throw new IllegalArgumentException("仅地区公告可审核");
        }
        a.setStatus("APPROVED");
        a.setActive(true);
        return announcementRepository.save(a);
    }

    @Override
    public Announcement rejectRegionAnnouncement(Long announcementId) {
        Announcement a = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new IllegalArgumentException("公告不存在"));
        if (!"REGION".equals(a.getScope())) {
            throw new IllegalArgumentException("仅地区公告可审核");
        }
        a.setStatus("REJECTED");
        a.setActive(false);
        return announcementRepository.save(a);
    }

    @Override
    public Announcement toggleAnnouncement(Long announcementId) {
        Announcement a = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new IllegalArgumentException("公告不存在"));
        if (!"APPROVED".equals(a.getStatus()) && a.getStatus() != null) {
            throw new IllegalArgumentException("仅已通过的公告可启用/停用");
        }
        a.setActive(!a.isActive());
        return announcementRepository.save(a);
    }

    @Override
    public void deleteAnnouncement(Long announcementId) {
        announcementRepository.deleteById(announcementId);
    }

    @Override
    public Map<String, Object> globalStats() {
        return Map.of(
                "totalUsers", userRepository.count(),
                "studentCount", userRepository.countByRole("USER"),
                "adminCount", userRepository.countByRole("ADMIN"),
                "totalItems", lostItemRepository.count(),
                "pendingItems", lostItemRepository.countByStatus("PENDING"),
                "claimedItems", lostItemRepository.countByStatus("CLAIMED"),
                "archivedItems", lostItemRepository.countByStatus("ARCHIVED")
        );
    }

    @Override
    public Map<String, Object> latestBackupInfo() {
        try {
            Path rootDir = getBackupRootDir();
            Files.createDirectories(rootDir);
            Path latest = findLatestBackupDir(rootDir);
            LinkedHashMap<String, Object> result = new LinkedHashMap<>();
            result.put("backupRoot", rootDir.toString());
            if (latest == null) {
                result.put("backupTime", "暂无");
                result.put("backupFolder", "暂无");
                result.put("tableCount", 0);
            } else {
                result.put("backupTime", formatFileTime(latest));
                result.put("backupFolder", latest.toString());
                result.put("tableCount", countSqlFiles(latest));
            }
            return result;
        } catch (IOException e) {
            throw new IllegalArgumentException("读取备份信息失败：" + e.getMessage());
        }
    }

    @Override
    public Map<String, Object> backupNow() {
        LocalDateTime now = LocalDateTime.now();
        Path rootDir;
        Path backupDir;
        try {
            rootDir = getBackupRootDir();
            Files.createDirectories(rootDir);
            backupDir = rootDir.resolve("backup-" + now.format(BACKUP_DIR_FORMATTER));
            Files.createDirectories(backupDir);
        } catch (IOException e) {
            throw new IllegalArgumentException("创建备份目录失败：" + e.getMessage());
        }

        List<String> fileNames = new ArrayList<>();
        try (Connection conn = dataSource.getConnection()) {
            String databaseName = conn.getCatalog();
            if (databaseName == null || databaseName.isBlank()) {
                throw new IllegalArgumentException("无法识别当前数据库名称");
            }
            List<String> tables = listTables(conn, databaseName);
            if (tables.isEmpty()) {
                throw new IllegalArgumentException("当前数据库没有可备份的数据表");
            }
            for (String table : tables) {
                Path sqlFile = backupDir.resolve(table + ".sql");
                exportTableSql(conn, table, sqlFile);
                fileNames.add(sqlFile.getFileName().toString());
            }
        } catch (SQLException | IOException e) {
            throw new IllegalArgumentException("执行备份失败：" + e.getMessage());
        }

        LinkedHashMap<String, Object> result = new LinkedHashMap<>();
        result.put("backupTime", now.format(DISPLAY_FORMATTER));
        result.put("backupFolder", backupDir.toString());
        result.put("tableCount", fileNames.size());
        result.put("files", fileNames);
        return result;
    }

    @Override
    public Map<String, Object> exportDataSql(Integer rangeMonths, List<String> types) {
        Set<Integer> validMonths = Set.of(1, 2, 4, 8, 12);
        if (rangeMonths == null || !validMonths.contains(rangeMonths)) {
            throw new IllegalArgumentException("导出时间范围仅支持：1个月、2个月、4个月、8个月、1年");
        }
        if (types == null || types.isEmpty()) {
            throw new IllegalArgumentException("请至少选择一种导出数据类型");
        }

        Set<String> allowTypes = Set.of("FOUND", "LOST", "GLOBAL_ANNOUNCEMENT", "REGION_ANNOUNCEMENT");
        Set<String> selectedTypes = new HashSet<>();
        for (String t : types) {
            if (t != null && !t.isBlank()) selectedTypes.add(t.trim());
        }
        if (selectedTypes.isEmpty() || selectedTypes.stream().anyMatch(t -> !allowTypes.contains(t))) {
            throw new IllegalArgumentException("导出数据类型不合法");
        }

        LocalDateTime since = LocalDateTime.now().minusMonths(rangeMonths);
        Path exportDir;
        String filename = "data-export-" + LocalDateTime.now().format(BACKUP_DIR_FORMATTER) + "-" + UUID.randomUUID().toString().substring(0, 8) + ".sql";
        try {
            exportDir = Paths.get(uploadDir).toAbsolutePath().normalize().resolve("exports");
            Files.createDirectories(exportDir);
        } catch (IOException e) {
            throw new IllegalArgumentException("创建导出目录失败：" + e.getMessage());
        }

        Path outFile = exportDir.resolve(filename);
        int totalRows = 0;
        List<String> exportedSections = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             BufferedWriter writer = Files.newBufferedWriter(outFile, StandardCharsets.UTF_8)) {
            writer.write("-- 数据导出文件\n");
            writer.write("-- 生成时间: " + LocalDateTime.now().format(DISPLAY_FORMATTER) + "\n");
            writer.write("-- 时间范围: 最近" + rangeMonths + "个月\n\n");

            if (selectedTypes.contains("FOUND") || selectedTypes.contains("LOST")) {
                List<String> itemTypes = new ArrayList<>();
                if (selectedTypes.contains("FOUND")) itemTypes.add("FOUND");
                if (selectedTypes.contains("LOST")) itemTypes.add("LOST");
                int count = exportRowsByQuery(
                        conn,
                        "lost_items",
                        buildInQuery("SELECT * FROM `lost_items` WHERE `created_at` >= ? AND `type` IN (%s) ORDER BY `created_at` DESC", itemTypes.size()),
                        combineParams(since, itemTypes),
                        writer
                );
                totalRows += count;
                if (selectedTypes.contains("FOUND")) exportedSections.add("失物招领");
                if (selectedTypes.contains("LOST")) exportedSections.add("寻物启事");
            }

            if (selectedTypes.contains("GLOBAL_ANNOUNCEMENT") || selectedTypes.contains("REGION_ANNOUNCEMENT")) {
                List<String> scopes = new ArrayList<>();
                if (selectedTypes.contains("GLOBAL_ANNOUNCEMENT")) scopes.add("GLOBAL");
                if (selectedTypes.contains("REGION_ANNOUNCEMENT")) scopes.add("REGION");
                int count = exportRowsByQuery(
                        conn,
                        "announcements",
                        buildInQuery("SELECT * FROM `announcements` WHERE `created_at` >= ? AND `scope` IN (%s) ORDER BY `created_at` DESC", scopes.size()),
                        combineParams(since, scopes),
                        writer
                );
                totalRows += count;
                if (selectedTypes.contains("GLOBAL_ANNOUNCEMENT")) exportedSections.add("全局公告");
                if (selectedTypes.contains("REGION_ANNOUNCEMENT")) exportedSections.add("地区公告");
            }
        } catch (SQLException | IOException e) {
            throw new IllegalArgumentException("导出失败：" + e.getMessage());
        }

        LinkedHashMap<String, Object> res = new LinkedHashMap<>();
        res.put("downloadUrl", "/uploads/exports/" + filename);
        res.put("fileName", filename);
        res.put("rangeMonths", rangeMonths);
        res.put("types", exportedSections);
        res.put("rows", totalRows);
        return res;
    }

    @Override
    public Map<String, Object> previewExpiredCleanup(Integer days) {
        int validDays = validateCleanupDays(days);
        LocalDateTime before = LocalDateTime.now().minusDays(validDays);
        long count = lostItemRepository.countExpiredForCleanup(CLEANUP_STATUSES, before);
        LinkedHashMap<String, Object> res = new LinkedHashMap<>();
        res.put("days", validDays);
        res.put("count", count);
        res.put("statuses", List.of("已归档", "已删除", "已认领"));
        return res;
    }

    @Override
    @Transactional
    public Map<String, Object> cleanupExpiredData(Integer days) {
        int validDays = validateCleanupDays(days);
        LocalDateTime before = LocalDateTime.now().minusDays(validDays);
        int cleaned = lostItemRepository.deleteExpiredForCleanup(CLEANUP_STATUSES, before);
        LinkedHashMap<String, Object> res = new LinkedHashMap<>();
        res.put("days", validDays);
        res.put("cleanedCount", cleaned);
        res.put("statuses", List.of("已归档", "已删除", "已认领"));
        return res;
    }

    private Path getBackupRootDir() {
        return Paths.get(backupOutputDir).toAbsolutePath().normalize();
    }

    private Path findLatestBackupDir(Path rootDir) throws IOException {
        try (var stream = Files.list(rootDir)) {
            return stream
                    .filter(Files::isDirectory)
                    .filter(p -> p.getFileName().toString().startsWith("backup-"))
                    .max((a, b) -> a.getFileName().toString().compareTo(b.getFileName().toString()))
                    .orElse(null);
        }
    }

    private int countSqlFiles(Path dir) throws IOException {
        try (var stream = Files.list(dir)) {
            return (int) stream.filter(Files::isRegularFile)
                    .filter(p -> p.getFileName().toString().endsWith(".sql"))
                    .count();
        }
    }

    private String formatFileTime(Path dir) throws IOException {
        Date lastModified = new Date(Files.getLastModifiedTime(dir).toMillis());
        return LocalDateTime.ofInstant(lastModified.toInstant(), ZoneId.systemDefault()).format(DISPLAY_FORMATTER);
    }

    private List<String> listTables(Connection conn, String databaseName) throws SQLException {
        List<String> tables = new ArrayList<>();
        String sql = "SELECT table_name FROM information_schema.tables WHERE table_schema = ? ORDER BY table_name";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, databaseName);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    tables.add(rs.getString(1));
                }
            }
        }
        return tables;
    }

    private void exportTableSql(Connection conn, String tableName, Path outputFile) throws SQLException, IOException {
        String createTableSql = getCreateTableSql(conn, tableName);
        String querySql = "SELECT * FROM `" + escapeIdentifier(tableName) + "`";
        try (BufferedWriter writer = Files.newBufferedWriter(outputFile, StandardCharsets.UTF_8)) {
            writer.write("-- Table: " + tableName + "\n");
            writer.write("DROP TABLE IF EXISTS `" + escapeIdentifier(tableName) + "`;\n");
            writer.write(createTableSql + ";\n\n");
            try (PreparedStatement ps = conn.prepareStatement(querySql);
                 ResultSet rs = ps.executeQuery()) {
                ResultSetMetaData md = rs.getMetaData();
                int colCount = md.getColumnCount();
                while (rs.next()) {
                    writer.write("INSERT INTO `" + escapeIdentifier(tableName) + "` (");
                    for (int i = 1; i <= colCount; i++) {
                        if (i > 1) writer.write(", ");
                        writer.write("`" + escapeIdentifier(md.getColumnName(i)) + "`");
                    }
                    writer.write(") VALUES (");
                    for (int i = 1; i <= colCount; i++) {
                        if (i > 1) writer.write(", ");
                        writer.write(toSqlValue(rs.getObject(i)));
                    }
                    writer.write(");\n");
                }
            }
        }
    }

    private String getCreateTableSql(Connection conn, String tableName) throws SQLException {
        String sql = "SHOW CREATE TABLE `" + escapeIdentifier(tableName) + "`";
        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                return rs.getString(2);
            }
        }
        throw new IllegalArgumentException("读取建表语句失败: " + tableName);
    }

    private int exportRowsByQuery(Connection conn, String tableName, String querySql, List<Object> params, BufferedWriter writer) throws SQLException, IOException {
        String createTableSql = getCreateTableSql(conn, tableName);
        writer.write("-- " + tableName + "\n");
        writer.write("DROP TABLE IF EXISTS `" + escapeIdentifier(tableName) + "`;\n");
        writer.write(createTableSql + ";\n");
        int rows = 0;
        try (PreparedStatement ps = conn.prepareStatement(querySql)) {
            for (int i = 0; i < params.size(); i++) {
                Object p = params.get(i);
                if (p instanceof LocalDateTime dt) {
                    ps.setObject(i + 1, dt);
                } else {
                    ps.setObject(i + 1, p);
                }
            }
            try (ResultSet rs = ps.executeQuery()) {
                ResultSetMetaData md = rs.getMetaData();
                int colCount = md.getColumnCount();
                while (rs.next()) {
                    rows++;
                    writer.write("INSERT INTO `" + escapeIdentifier(tableName) + "` (");
                    for (int i = 1; i <= colCount; i++) {
                        if (i > 1) writer.write(", ");
                        writer.write("`" + escapeIdentifier(md.getColumnName(i)) + "`");
                    }
                    writer.write(") VALUES (");
                    for (int i = 1; i <= colCount; i++) {
                        if (i > 1) writer.write(", ");
                        writer.write(toSqlValue(rs.getObject(i)));
                    }
                    writer.write(");\n");
                }
            }
        }
        writer.write("\n");
        return rows;
    }

    private String buildInQuery(String basePattern, int count) {
        String[] qs = new String[count];
        Arrays.fill(qs, "?");
        return String.format(basePattern, String.join(",", qs));
    }

    private List<Object> combineParams(LocalDateTime since, List<String> values) {
        List<Object> params = new ArrayList<>();
        params.add(since);
        params.addAll(values);
        return params;
    }

    private int validateCleanupDays(Integer days) {
        if (days == null || days < 1 || days > 3650) {
            throw new IllegalArgumentException("清理天数需在1-3650之间");
        }
        return days;
    }

    private String toSqlValue(Object value) {
        if (value == null) return "NULL";
        if (value instanceof Number) return value.toString();
        if (value instanceof Boolean bool) return bool ? "1" : "0";
        if (value instanceof byte[] bytes) return "X'" + toHex(bytes) + "'";
        String text = value instanceof Date date
                ? LocalDateTime.ofInstant(date.toInstant(), ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                : value.toString();
        return "'" + escapeString(text) + "'";
    }

    private String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02X", b));
        }
        return sb.toString();
    }

    private String escapeString(String value) {
        return value.replace("\\", "\\\\").replace("'", "''");
    }

    private String escapeIdentifier(String value) {
        return value.replace("`", "``");
    }
}
