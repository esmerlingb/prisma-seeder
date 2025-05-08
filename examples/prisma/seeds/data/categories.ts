interface Category {
  id: string
  name: string
}

export const categories: Category[] = [
  {
    // Use a constant id to make the seed idempotent
    id: '61ba3e3b-2fbe-4ede-b4d4-d39cbf9e7c4c',
    name: 'Elf'
  },
  {
    id: 'e9620577-af7f-4eaa-abea-1724ce95aa84',
    name: 'Dryad'
  },
  {
    id: 'cb1e2ec1-a5b5-4330-ae85-4e0a046f50e9',
    name: 'Gnome'
  }
]
