package com.pgfinder.model;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.LinkedHashMap;
import java.util.Map;

/** Stores the weekly food menu map as a JSON string in one column. */
@Converter
public class FoodMenuConverter implements AttributeConverter<Map<String, Map<String, String>>, String> {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<LinkedHashMap<String, Map<String, String>>> TYPE = new TypeReference<>() {};

    @Override
    public String convertToDatabaseColumn(Map<String, Map<String, String>> menu) {
        try {
            return menu == null ? null : MAPPER.writeValueAsString(menu);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Could not save food menu", e);
        }
    }

    @Override
    public Map<String, Map<String, String>> convertToEntityAttribute(String json) {
        try {
            return json == null ? new LinkedHashMap<>() : MAPPER.readValue(json, TYPE);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Could not read food menu", e);
        }
    }
}
