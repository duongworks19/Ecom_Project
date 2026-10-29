package com.vic.ecom.controller;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.services.AdminReportService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import org.springframework.http.*;

@RestController
@RequestMapping("/api/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {
    private final AdminReportService service;
    public AdminReportController(AdminReportService service){this.service=service;}
    @GetMapping("/filters") public ApiResponse<?> filters(){return ApiResponse.ok("Danh sách bộ lọc",service.filters());}
    @GetMapping("/overview") public ApiResponse<?> overview(@RequestParam(defaultValue="7days") String period,
            @RequestParam(required=false) LocalDate from,@RequestParam(required=false) LocalDate to,
            @RequestParam(required=false) Long vendorId){return ApiResponse.ok("Báo cáo tổng quan",service.overview(period,from,to,vendorId));}
    @GetMapping(value="/export/{type}", produces="text/csv")
    public ResponseEntity<byte[]> export(@PathVariable String type, @RequestParam(defaultValue="7days") String period) {
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=\""+type+"-report.csv\"").body(service.export(type,period));
    }
}
