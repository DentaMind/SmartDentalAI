# Relationships
patient = relationship("Patient", back_populates="user")
cases = relationship("Case", back_populates="doctor")
prescriptions = relationship("Prescription", back_populates="doctor") 