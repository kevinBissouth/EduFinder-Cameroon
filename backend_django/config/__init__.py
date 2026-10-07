import pymysql

# Django attend le pilote mysqlclient (module MySQLdb), qui exige des en-têtes
# MySQL de développement pour être compilé. PyMySQL est en pur Python et se
# fait passer pour lui : aucune dépendance système à installer.
pymysql.install_as_MySQLdb()
