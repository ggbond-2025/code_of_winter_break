package com.campus.lostfound.service;

import com.campus.lostfound.model.SystemConfig;

import java.util.Collection;

public interface SystemConfigService {
    SystemConfig getConfig();
    SystemConfig updateConfig(SystemConfig update);
    boolean containsForbiddenWord(String content);
    boolean containsForbiddenWord(Collection<String> contents);
}
