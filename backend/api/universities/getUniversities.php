<?php
include_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

include "../../config/db.php";

$sql = "SELECT * FROM university_domains";

$result = $conn->query($sql);

$universities = [];

while ($row = $result->fetch_assoc()) {
    $universities[] = $row;
}

echo json_encode($universities); //show the universities in json format on the browser

?>