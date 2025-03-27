// обычно это делается в главном файле, но тут автор решил вынести в отдельный
const cluster = require('cluster')

// просто поделай запросы и увидишь в промежуточном ПО, что запрос обрабатывают разные ядра
function startWorker () {
  const worker = cluster.fork()
  console.log('КЛАСТЕР: Исполнитель %d запущен', worker.id)
}

if(cluster.isMaster) {
  require('os').cpus().forEach(function () {
    startWorker()
  })

  // Логгируем всех отключившихся воркеров.
  // Если воркер отключается, он должен завершить работу, так что ждем события завершения работы для
  // порождения нового воркера ему на замену
  cluster.on('disconnect', function(worker){
    console.log('КЛАСТЕР: Исполнитель %d отключился от кластера.', worker.id)
  })

  // Когда исполнитель завершил работу, создаем воркера ему на замену
  cluster.on('exit', function (worker, code, signal) {
    console.log('КЛАСТЕР: Исполнитель %d завершил работу с кодом %d (%s)',
      worker.id, code, signal);
    startWorker();
  })
} else {
  require ('./meadowlark')()
}
