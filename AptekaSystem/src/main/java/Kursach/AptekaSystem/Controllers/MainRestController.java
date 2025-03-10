package Kursach.AptekaSystem.Controllers;

import Kursach.AptekaSystem.DAOs.DAO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Setter
@Getter
public class MainRestController {

    private final DAO dao;
    private final ObjectMapper objectMapper;

    @Autowired
    public MainRestController(DAO dao, ObjectMapper objectMapper) {
        this.dao = dao;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/getPage")
    public ResponseEntity<?> getData(@RequestBody JsonNode jsonNode) {
        List<JsonNode> data = dao.getDataFromTable(jsonNode);
        return new ResponseEntity<>(data, HttpStatus.OK);
    }

    @PostMapping("/getAllRecords/{tableName}")
    public ResponseEntity<?> getAllRecords(@PathVariable("tableName") String tableName) {
        List<JsonNode> data = dao.getAllRecordsFromTable(tableName);
        return new ResponseEntity<>(data, HttpStatus.OK);
    }

    @PostMapping("/getCount/{tableName}")
    public ResponseEntity<?> getCount(
            @PathVariable("tableName") String tableName) {
        int count = dao.getDataCountFromTable(tableName);
        return new ResponseEntity<>(count, HttpStatus.OK);
    }

    @PostMapping("/getColumns")
    public ResponseEntity<?> getColumns(
            @RequestBody JsonNode jsonNode) {
        JsonNode data = dao.getColumns(jsonNode);
        return new ResponseEntity<>(data, HttpStatus.OK);
    }

    @PostMapping("/addData/{tableName}")
    public ResponseEntity<?> addData(@RequestBody JsonNode jsonNode,
                                     @PathVariable("tableName") String tableName) {
        JsonNode data = dao.addDataToTable(tableName, jsonNode);
        return new ResponseEntity<>(data, HttpStatus.OK);
    }

    @PostMapping("/getCell/{tableName}/{columnName}")
    public ResponseEntity<?> getCell(
            @PathVariable("tableName") String tableName,
            @PathVariable("columnName") String columnName,
            @RequestBody JsonNode jsonNode) {
        String data = dao.getCellFromTable(jsonNode, tableName, columnName);
        return new ResponseEntity<>(data, HttpStatus.OK);
    }

    @PostMapping("/editData/{tableName}")
    public ResponseEntity<?> editData(
            @PathVariable("tableName") String tableName,
            @RequestBody JsonNode jsonNode) {
        dao.editDataToTable(tableName, jsonNode);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/deleteData/{tableName}")
    public ResponseEntity<?> deleteData(
            @PathVariable("tableName") String tableName,
            @RequestBody JsonNode jsonNode) {
        dao.deleteDataFromTable(tableName, jsonNode);
        return ResponseEntity.ok().build();
    }
}
