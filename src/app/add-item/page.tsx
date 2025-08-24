
import React from 'react'
import AddItemForm from '../../../components/AddItemForm';

const AddItemPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Dodaj novi predmet</h1>
            <p className="text-xl text-emerald-100 max-w-2xl mx-auto">
              Podelite svoje stvari sa zajednicom i zaradite dodatni novac
            </p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <AddItemForm />
        </div>
      </div>
    </div>
  )
}

export default AddItemPage
