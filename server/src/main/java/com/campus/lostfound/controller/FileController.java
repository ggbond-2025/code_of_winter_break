package com.campus.lostfound.controller;

import com.campus.lostfound.common.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private static final Logger log = LoggerFactory.getLogger(FileController.class);

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @PostMapping("/upload")
    public ApiResponse<List<String>> upload(@RequestParam("files") MultipartFile[] files) throws IOException {
        Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(dir);
        log.info("Upload directory: {}", dir);

        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;
            String original = file.getOriginalFilename();
            String ext = "";
            if (original != null && original.contains(".")) {
                ext = original.substring(original.lastIndexOf('.'));
            }
            String filename = UUID.randomUUID().toString().replace("-", "") + ext;
            Path target = dir.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            log.info("Saved file: {}", target);
            urls.add("/uploads/" + filename);
        }
        return ApiResponse.ok(urls);
    }

    @GetMapping("/check")
    public ApiResponse<String> check() {
        Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
        boolean exists = Files.exists(dir);
        long count = 0;
        try { count = Files.list(dir).count(); } catch (IOException ignored) {}
        return ApiResponse.ok("Upload dir: " + dir + ", exists: " + exists + ", files: " + count);
    }
}
