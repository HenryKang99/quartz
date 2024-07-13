---
title: 'mysql事件调度器与存储过程创建日期分区'
categories: ''
description: ''
order: 0
date: 2023-11
---

```sql
# 查看当前数据库版本  
select version();  
# 查看是否开启了事件调度器  
show variables like 'event_scheduler';  
# 查看分区组件 partition 的 Status 是否 ACTIVEshow plugins;  
# 查看当前使用的库  
select schema();  
  
  
/*  
分区命名：p今日日期 less than 明日日期  
例如：p20231122 values less than (to_days('2023-11-23'))  
自增主键策略为 primary key(id, check_date)注意创建分区必须自增  
*/  
-- 创建分区  
alter table ${tableName} add partition (partition ${partitionName} values less than (to_days('yyyy-MM-dd')));  
-- 删除分区  
alter table ${tableName} drop partition ${partitionName1}, ${partitionName2};  
  
-- 查询分区  
SELECT TABLE_SCHEMA, TABLE_NAME, PARTITION_NAME  
FROM INFORMATION_SCHEMA.PARTITIONS  
WHERE TABLE_SCHEMA = schema()  
AND TABLE_NAME = ${tableName}  
AND PARTITION_NAME = ${partitionName}  
ORDER BY PARTITION_NAME DESC;  
  
-- 查询指定表 n 期之前的分区名，并用逗号分割，用于后面拼接 drop 语句  
SELECT GROUP_CONCAT(PARTITION_NAME SEPARATOR ',')  
FROM (SELECT PARTITION_NAME  
      FROM INFORMATION_SCHEMA.PARTITIONS  
      WHERE TABLE_SCHEMA = schema()  
        AND TABLE_NAME = ${tableName}  
      ORDER BY PARTITION_NAME DESC  
      -- 倒序排序后，offset n 其中 n 表示要保留的期数  
      LIMIT 100 OFFSET 5) r;  
  
/*已有表数据创建复合索引并创建分区举例*/  
ALTER TABLE ${tableName} MODIFY id INT NOT NULL;  
alter table ${tableName} drop primary key;  
alter table ${tableName} add primary key (id, data_date);  
ALTER TABLE ${tableName} MODIFY id INT NOT NULL AUTO_INCREMENT;  
ALTER TABLE ${tableName}  
    PARTITION BY RANGE (to_days(data_date))  
        (  
        PARTITION p20230803 values less than (to_days('2023-08-04')),  
        PARTITION p20230804 values less than (to_days('2023-08-05')),  
        PARTITION p20230805 values less than (to_days('2023-08-06')),  
        PARTITION p20230806 values less than (to_days('2023-08-07')),  
        PARTITION p20230807 values less than (to_days('2023-08-08')),  
        PARTITION p20230808 values less than (to_days('2023-08-09'))  
        );  
  
/*事件调度器*/  
-- 创建事件来每天定时执行操作  
CREATE EVENT create_detail_check_partition_event  
    ON SCHEDULE EVERY 1 DAY  
        STARTS DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 1 HOUR)  
    DO CALL create_detail_check_partition_procedure();  
  
DELIMITER $$  
create procedure create_detail_check_partition_procedure()  
begin  
    DECLARE new_date DATE;  
    DECLARE new_partition_name VARCHAR(50);  
    DECLARE new_partition_value DATE;  
  
    DECLARE yesterday_date DATE;  
    DECLARE yesterday_partition_name VARCHAR(50);  
    DECLARE yesterday_partition_value DATE;  
  
    -- 循环处理多个表  
    DECLARE partition_num INT DEFAULT 0;  
    DECLARE old_partition_name VARCHAR(255) DEFAULT NULL;  
    DECLARE current_table_name VARCHAR(50);  
    DECLARE done INT DEFAULT FALSE;  
    DECLARE error_state text;  
    DECLARE error_message text;  
  
    -- 查询需要删减分区的明细表  
    DECLARE tables_cursor CURSOR FOR  
        SELECT table_name  
        FROM information_schema.tables  
        WHERE table_schema = schema()  
          AND table_name LIKE 'detail\_check\__';  
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;  
    -- 异常处理  
    DECLARE EXIT HANDLER FOR SQLEXCEPTION  
        BEGIN            GET DIAGNOSTICS CONDITION 1  
                error_state = RETURNED_SQLSTATE, error_message = MESSAGE_TEXT;  
            SELECT CONCAT('MySQL Error:', error_state, ' - ', error_message) AS ErrorMessage;  
            COMMIT;  
        END;  
  
    -- 计算分区的名称和值  
    SET new_date = CURDATE();  
    SET new_partition_name = CONCAT('p', DATE_FORMAT(new_date, '%Y%m%d'));  
    SET new_partition_value = ADDDATE(new_date, INTERVAL 1 DAY);  
  
    SET yesterday_date = DATE_SUB(new_date, INTERVAL 1 DAY);  
    SET yesterday_partition_name = CONCAT('p', DATE_FORMAT(yesterday_date, '%Y%m%d'));  
    SET yesterday_partition_value = ADDDATE(yesterday_date, INTERVAL 1 DAY);  
  
    OPEN tables_cursor;  
    read_loop: LOOP  
        FETCH tables_cursor INTO current_table_name;  
        IF done THEN  
            LEAVE read_loop;  
        END IF;  
  
        -- 删除每个表的老分区，存在才删除  
        SET old_partition_name = NULL;  
        SELECT GROUP_CONCAT(PARTITION_NAME SEPARATOR ',') INTO old_partition_name  
        FROM (SELECT PARTITION_NAME  
              FROM INFORMATION_SCHEMA.PARTITIONS  
              WHERE TABLE_SCHEMA = schema()  
                AND TABLE_NAME = current_table_name  
              ORDER BY PARTITION_NAME DESC  
              -- 倒序排序后，offset n 其中 n 表示要保留的期数  
              LIMIT 100 OFFSET 5) r;  
        IF old_partition_name IS NOT NULL THEN  
            SET @delete_partition_sql = CONCAT('ALTER TABLE ', current_table_name, ' DROP PARTITION ', old_partition_name);  
            PREPARE delete_partition_stmt FROM @delete_partition_sql;  
            EXECUTE delete_partition_stmt;  
            DEALLOCATE PREPARE delete_partition_stmt;  
        END IF;  
  
        -- 为每个表创建昨天和今天的分区，先判断是否存在，不存在才创建，因为不支持 if exist 关键字  
        SET partition_num = 0;  
        SELECT count(*) INTO partition_num  
        FROM INFORMATION_SCHEMA.PARTITIONS  
        WHERE TABLE_SCHEMA = schema()  
          AND table_name = current_table_name  
          AND PARTITION_NAME = yesterday_partition_name;  
        IF partition_num = 0 THEN  
            SET @create_partition_sql = CONCAT('ALTER TABLE ', current_table_name, ' ADD PARTITION (PARTITION ', yesterday_partition_name, ' VALUES LESS THAN (TO_DAYS(\'', yesterday_partition_value, '\')))');  
            PREPARE create_partition_stmt FROM @create_partition_sql;  
            EXECUTE create_partition_stmt;  
            DEALLOCATE PREPARE create_partition_stmt;  
        END IF;  
  
        SET partition_num = 0;  
        SELECT count(*) INTO partition_num  
        FROM INFORMATION_SCHEMA.PARTITIONS  
        WHERE TABLE_SCHEMA = schema()  
          AND table_name = current_table_name  
          AND PARTITION_NAME = new_partition_name;  
        IF partition_num <= 0 THEN  
            SET @create_partition_sql = CONCAT('ALTER TABLE ', current_table_name, ' ADD PARTITION (PARTITION ', new_partition_name, ' VALUES LESS THAN (TO_DAYS(\'', new_partition_value, '\')))');  
            PREPARE create_partition_stmt FROM @create_partition_sql;  
            EXECUTE create_partition_stmt;  
            DEALLOCATE PREPARE create_partition_stmt;  
        END IF;  
  
    END LOOP;  
  
    CLOSE tables_cursor;  
  
end  
$$  
DELIMITER ;  
  
SHOW PLUGINS;
```
