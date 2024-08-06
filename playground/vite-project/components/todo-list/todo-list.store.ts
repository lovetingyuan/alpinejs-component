import Alpine from 'alpinejs'

Alpine.store('todoList', {
  list: [],
  status: 'all',
  get displayList() {
    if (this.status === 'all') {
      return this.list
    }
    return this.list.filter(v => v.status === this.status)
  },
  delete(id) {
    this.list = this.list.filter(v => v.id !== id)
  },
  add(item) {
    this.list.push({
      title: item,
      id: Math.random().toString(),
      status: 'todo',
    })
  },
  changeStatus(id) {
    const item = this.list.find(v => v.id === id)
    if (item.status === 'todo') {
      item.status = 'doing'
    } else if (item.status === 'doing') {
      item.status = 'done'
    }
  },
})

export default Alpine.store('todoList')
