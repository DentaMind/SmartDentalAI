# Relationships
patient = relationship("Patient", back_populates="cases")
doctor = relationship("User", back_populates="cases")
prescriptions = relationship("Prescription", back_populates="case") 