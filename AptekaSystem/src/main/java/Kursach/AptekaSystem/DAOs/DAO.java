package Kursach.AptekaSystem.DAOs;

import Kursach.AptekaSystem.RowMappers.JsonNodeRowMapper;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Getter;
import lombok.Setter;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Setter
@Getter
public class DAO {

    private JdbcTemplate jdbcTemplate;

    public DAO(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<JsonNode> getDataFromTable(JsonNode jsonNode) throws DataAccessException {
        String sql = "SELECT * FROM получить_страницу_из_таблицы(?::jsonb)";
        String jsonText = jsonNode.toString();
        return jdbcTemplate.query(sql, new JsonNodeRowMapper(), jsonText);
    }

    public List<JsonNode> getAllRecordsFromTable(String tableName) throws DataAccessException {
        String sql = "SELECT * FROM GetAllRecords(?)";
        return jdbcTemplate.query(sql, new JsonNodeRowMapper(), tableName);
    }

    public JsonNode getColumns(JsonNode jsonNode) throws DataAccessException {
        String jsonText = jsonNode.toString();
        String sql = "SELECT * FROM получить_столбцы(?::jsonb)";
        return jdbcTemplate.queryForObject(sql, new JsonNodeRowMapper(), jsonText);
    }

    public String getCellFromTable(JsonNode jsonNode, String tableName, String columnName) throws DataAccessException {
        String jsonText = jsonNode.toString();
        String sql = "SELECT * FROM получить_ячейку(?::jsonb, ?, ?)";
        return jdbcTemplate.queryForObject(sql, String.class, jsonText, tableName, columnName);
    }

    public JsonNode addDataToTable(String tableName, JsonNode jsonNode) throws DataAccessException  {
        String jsonString = jsonNode.toString();
        String sql = "SELECT * FROM добавить_запись_в_таблицу(?, ?::jsonb)";
        return jdbcTemplate.queryForObject(sql, new JsonNodeRowMapper(), tableName, jsonString);
    }

    public void editDataToTable(String tableName, JsonNode jsonNode) throws DataAccessException {
        String jsonString = jsonNode.toString();
        String sql = "CALL изменить_запись_в_таблице(?, ?::jsonb)";
        jdbcTemplate.update(sql, tableName, jsonString);
    }

    public void deleteDataFromTable(String tableName, JsonNode jsonNode) throws DataAccessException {
        String jsonString = jsonNode.toString();
        String sql = "CALL удалить_запись_из_таблицы(?, ?::jsonb)";
        jdbcTemplate.update(sql, tableName, jsonString);
    }

    public int getDataCountFromTable(String tableName) throws DataAccessException {
        String sql = "SELECT получить_количество_записей(?)";
        return jdbcTemplate.queryForObject(sql, Integer.class, tableName);
    }
}