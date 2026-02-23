package com.akylas.weather.widgetstestapplication

import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Point
import android.os.Bundle
import android.provider.MediaStore
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.palette.graphics.Palette
import com.akylas.weather.widgetstestapplication.databinding.FragmentFirstBinding
import com.google.android.material.snackbar.Snackbar
import java.io.File
import kotlin.jvm.functions.FunctionN


/**
 * A simple [Fragment] subclass as the default destination in the navigation.
 */
class FirstFragment : Fragment() {

    private var photoTime: Long = 0
    private var _binding: FragmentFirstBinding? = null

    // This property is only valid between onCreateView and
    // onDestroyView.
    private val binding get() = _binding!!


    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View? {

        _binding = FragmentFirstBinding.inflate(inflater, container, false)
        return binding.root

    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val activity = this.requireActivity()


        binding.fab.setOnClickListener { view ->
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}