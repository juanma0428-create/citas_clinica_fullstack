-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: db_sys_citas
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `tb_administradores`
--

DROP TABLE IF EXISTS `tb_administradores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_administradores` (
  `id_administrador` int NOT NULL AUTO_INCREMENT,
  `nombre_adm` varchar(100) NOT NULL,
  `apellido_adm` varchar(100) NOT NULL,
  `id_usuario` int NOT NULL,
  PRIMARY KEY (`id_administrador`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `tb_administradores_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `tb_usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_administradores`
--

LOCK TABLES `tb_administradores` WRITE;
/*!40000 ALTER TABLE `tb_administradores` DISABLE KEYS */;
INSERT INTO `tb_administradores` VALUES (1,'Roberto','Sánchez',5),(2,'Laura','Gómez',6);
/*!40000 ALTER TABLE `tb_administradores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_citas`
--

DROP TABLE IF EXISTS `tb_citas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_citas` (
  `id_cita` int NOT NULL AUTO_INCREMENT,
  `id_medico` int NOT NULL,
  `id_cliente` int NOT NULL,
  `id_sala` int NOT NULL,
  `id_horario` int NOT NULL,
  `motivo_consulta` text NOT NULL,
  `diagnosticos` text,
  `recetas` text,
  `estado_cita` enum('pendiente','confirmada','cancelada','finalizada') DEFAULT 'pendiente',
  PRIMARY KEY (`id_cita`),
  KEY `id_medico` (`id_medico`),
  KEY `id_cliente` (`id_cliente`),
  KEY `id_sala` (`id_sala`),
  KEY `id_horario` (`id_horario`),
  CONSTRAINT `tb_citas_ibfk_1` FOREIGN KEY (`id_medico`) REFERENCES `tb_medicos` (`id_medico`),
  CONSTRAINT `tb_citas_ibfk_2` FOREIGN KEY (`id_cliente`) REFERENCES `tb_clientes` (`id_cliente`),
  CONSTRAINT `tb_citas_ibfk_3` FOREIGN KEY (`id_sala`) REFERENCES `tb_salas` (`id_sala`),
  CONSTRAINT `tb_citas_ibfk_4` FOREIGN KEY (`id_horario`) REFERENCES `tb_horarios` (`id_horario`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_citas`
--

LOCK TABLES `tb_citas` WRITE;
/*!40000 ALTER TABLE `tb_citas` DISABLE KEYS */;
INSERT INTO `tb_citas` VALUES (1,1,1,1,1,'Chequeo de presión arterial de rutina','Presión arterial ligeramente alta','Reducir consumo de sal, ejercicio moderado','finalizada'),(2,2,2,2,3,'Control mensual del bebé','Desarrollo normal, peso adecuado','Vitaminas de rutina','confirmada');
/*!40000 ALTER TABLE `tb_citas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_clientes`
--

DROP TABLE IF EXISTS `tb_clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_clientes` (
  `id_cliente` int NOT NULL AUTO_INCREMENT,
  `nombre_cli` varchar(100) NOT NULL,
  `apellido_cli` varchar(100) NOT NULL,
  `nacimiento_cli` date NOT NULL,
  `telefono_cli` varchar(20) DEFAULT NULL,
  `id_usuario` int NOT NULL,
  PRIMARY KEY (`id_cliente`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `tb_clientes_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `tb_usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_clientes`
--

LOCK TABLES `tb_clientes` WRITE;
/*!40000 ALTER TABLE `tb_clientes` DISABLE KEYS */;
INSERT INTO `tb_clientes` VALUES (1,'Juan Manuel','Chica','1995-04-12','4123-5678',1),(2,'María','García','1990-11-20','5987-1234',2);
/*!40000 ALTER TABLE `tb_clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_equipos`
--

DROP TABLE IF EXISTS `tb_equipos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_equipos` (
  `id_equipo` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `id_especialidad` int NOT NULL,
  `cantidad` int NOT NULL,
  PRIMARY KEY (`id_equipo`),
  KEY `id_especialidad` (`id_especialidad`),
  CONSTRAINT `tb_equipos_ibfk_1` FOREIGN KEY (`id_especialidad`) REFERENCES `tb_especialidades` (`id_especialidad`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_equipos`
--

LOCK TABLES `tb_equipos` WRITE;
/*!40000 ALTER TABLE `tb_equipos` DISABLE KEYS */;
INSERT INTO `tb_equipos` VALUES (1,'Monitor Cardíaco',1,2),(2,'Camilla Pediátrica',2,1);
/*!40000 ALTER TABLE `tb_equipos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_especialidades`
--

DROP TABLE IF EXISTS `tb_especialidades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_especialidades` (
  `id_especialidad` int NOT NULL AUTO_INCREMENT,
  `nombre_especialidad` varchar(100) NOT NULL,
  PRIMARY KEY (`id_especialidad`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_especialidades`
--

LOCK TABLES `tb_especialidades` WRITE;
/*!40000 ALTER TABLE `tb_especialidades` DISABLE KEYS */;
INSERT INTO `tb_especialidades` VALUES (1,'Cardiología'),(2,'Pediatría');
/*!40000 ALTER TABLE `tb_especialidades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_horarios`
--

DROP TABLE IF EXISTS `tb_horarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_horarios` (
  `id_horario` int NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `hora_reserva` time NOT NULL,
  `disponibilidad` tinyint(1) DEFAULT '1',
  `id_medico` int NOT NULL,
  PRIMARY KEY (`id_horario`),
  KEY `id_medico` (`id_medico`),
  CONSTRAINT `tb_horarios_ibfk_1` FOREIGN KEY (`id_medico`) REFERENCES `tb_medicos` (`id_medico`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_horarios`
--

LOCK TABLES `tb_horarios` WRITE;
/*!40000 ALTER TABLE `tb_horarios` DISABLE KEYS */;
INSERT INTO `tb_horarios` VALUES (1,'2026-08-25','09:00:00',0,1),(2,'2026-08-25','10:00:00',1,1),(3,'2026-08-26','14:00:00',0,2),(4,'2026-08-26','15:00:00',1,2);
/*!40000 ALTER TABLE `tb_horarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_medicos`
--

DROP TABLE IF EXISTS `tb_medicos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_medicos` (
  `id_medico` int NOT NULL AUTO_INCREMENT,
  `nombre_med` varchar(100) NOT NULL,
  `apellido_med` varchar(100) NOT NULL,
  `id_especialidad` int NOT NULL,
  `telefono_med` varchar(20) DEFAULT NULL,
  `equipo_disponible` varchar(255) DEFAULT NULL,
  `id_usuario` int NOT NULL,
  PRIMARY KEY (`id_medico`),
  KEY `id_especialidad` (`id_especialidad`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `tb_medicos_ibfk_1` FOREIGN KEY (`id_especialidad`) REFERENCES `tb_especialidades` (`id_especialidad`),
  CONSTRAINT `tb_medicos_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `tb_usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_medicos`
--

LOCK TABLES `tb_medicos` WRITE;
/*!40000 ALTER TABLE `tb_medicos` DISABLE KEYS */;
INSERT INTO `tb_medicos` VALUES (1,'Carlos','López',1,'3214-5678','Estetoscopio, Tensiómetro',3),(2,'Ana','Martínez',2,'5555-0202','Báscula pediátrica',4);
/*!40000 ALTER TABLE `tb_medicos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_roles`
--

DROP TABLE IF EXISTS `tb_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_roles` (
  `id_rol` int NOT NULL AUTO_INCREMENT,
  `nombre_rol` varchar(50) NOT NULL,
  PRIMARY KEY (`id_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_roles`
--

LOCK TABLES `tb_roles` WRITE;
/*!40000 ALTER TABLE `tb_roles` DISABLE KEYS */;
INSERT INTO `tb_roles` VALUES (1,'Paciente'),(2,'Medico'),(3,'Administrador');
/*!40000 ALTER TABLE `tb_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_salas`
--

DROP TABLE IF EXISTS `tb_salas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_salas` (
  `id_sala` int NOT NULL AUTO_INCREMENT,
  `nombre_sala` varchar(50) NOT NULL,
  `id_especialidad` int NOT NULL,
  PRIMARY KEY (`id_sala`),
  KEY `id_especialidad` (`id_especialidad`),
  CONSTRAINT `tb_salas_ibfk_1` FOREIGN KEY (`id_especialidad`) REFERENCES `tb_especialidades` (`id_especialidad`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_salas`
--

LOCK TABLES `tb_salas` WRITE;
/*!40000 ALTER TABLE `tb_salas` DISABLE KEYS */;
INSERT INTO `tb_salas` VALUES (1,'Consultorio A1',1),(2,'Consultorio B2',2);
/*!40000 ALTER TABLE `tb_salas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_usuarios`
--

DROP TABLE IF EXISTS `tb_usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nombre_usuario` varchar(100) NOT NULL,
  `contrasenia` varchar(255) NOT NULL,
  `id_rol` int NOT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `nombre_usuario` (`nombre_usuario`),
  KEY `id_rol` (`id_rol`),
  CONSTRAINT `tb_usuarios_ibfk_1` FOREIGN KEY (`id_rol`) REFERENCES `tb_roles` (`id_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_usuarios`
--

LOCK TABLES `tb_usuarios` WRITE;
/*!40000 ALTER TABLE `tb_usuarios` DISABLE KEYS */;
INSERT INTO `tb_usuarios` VALUES (1,'paciente_juan','clave123',1),(2,'paciente_maria','clave123',1),(3,'dr_carlos','clave123',2),(4,'dra_ana','clave123',2),(5,'admin_roberto','clave123',3),(6,'admin_laura','clave123',3);
/*!40000 ALTER TABLE `tb_usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-23 12:42:20
