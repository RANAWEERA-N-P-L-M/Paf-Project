function InputField({ label, type = 'text', value, onChange, placeholder, required, name }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-semibold text-textSecondary mb-1">
          {label}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 border border-borderColor rounded-md bg-white text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-accent transition duration-200"
      />
    </div>
  )
}

export default InputField
