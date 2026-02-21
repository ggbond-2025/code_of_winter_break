package com.campus.lostfound.service;

import com.campus.lostfound.model.SystemConfig;

public interface SystemConfigService {
    SystemConfig getConfig();
    SystemConfig updateConfig(SystemConfig update);
}
