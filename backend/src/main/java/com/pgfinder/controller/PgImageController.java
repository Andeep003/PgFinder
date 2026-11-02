package com.pgfinder.controller;

import com.pgfinder.dto.ApiDtos.ImageDto;
import com.pgfinder.service.PgImageService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/owner/pgs/{pgId}/images")
@PreAuthorize("hasRole('OWNER')")
public class PgImageController {

    private final PgImageService imageService;

    public PgImageController(PgImageService imageService) {
        this.imageService = imageService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ImageDto upload(Authentication authentication, @PathVariable String pgId,
                           @RequestPart("file") MultipartFile file) {
        return imageService.upload(authentication.getName(), pgId, file);
    }

    @DeleteMapping("/{imageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication authentication, @PathVariable String pgId, @PathVariable String imageId) {
        imageService.delete(authentication.getName(), pgId, imageId);
    }
}
